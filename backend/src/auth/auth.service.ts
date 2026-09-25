import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Prisma, Role, User } from '@prisma/client'
import * as argon2 from 'argon2'
import { createHash, randomUUID } from 'crypto'
import { ApiException } from '../common/api-exception'
import { PrismaService } from '../prisma/prisma.service'
import { ForgotPasswordDto, LoginDto, RegisterDto } from './dto'

export interface PublicUser {
  id: string
  email: string
  name: string
  phone: string | null
  role: Role
  status: 'ACTIVE' | 'DISABLED'
  avatarUrl: string | null
  createdAt: Date
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthResult {
  user: PublicUser
  tokens: TokenPair
}

export interface AccessTokenPayload {
  sub: string
  email: string
  role: Role
  type: 'access'
}

export interface RefreshTokenPayload {
  sub: string
  role: Role
  type: 'refresh'
  jti: string
}

const PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase()
    const normalized: RegisterDto = { ...dto, email }

    const existing = await this.prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw ApiException.conflict('EMAIL_TAKEN', 'An account with this email already exists.')
    }

    const passwordHash = await argon2.hash(dto.password)
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        role: Role.CUSTOMER,
        customerProfile: { create: {} },
      },
      select: PUBLIC_SELECT,
    })

    const tokens = await this.issueTokens(user)
    return { user, tokens }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user || user.deletedAt) {
      throw ApiException.unauthorized('Invalid email or password.')
    }
    if (user.status === 'DISABLED') {
      throw ApiException.forbidden('This account has been disabled. Contact support.')
    }
    const valid = await argon2.verify(user.passwordHash, dto.password).catch(() => false)
    if (!valid) {
      throw ApiException.unauthorized('Invalid email or password.')
    }
    const publicUser = await this.toPublic(user.id)
    const tokens = await this.issueTokens(publicUser)
    return { user: publicUser, tokens }
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: RefreshTokenPayload
    try {
      payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.refreshSecret(),
      })
    } catch {
      throw ApiException.unauthorized('Your session has expired. Please sign in again.')
    }
    if (payload.type !== 'refresh' || !payload.jti) {
      throw ApiException.unauthorized('Invalid refresh token.')
    }

    const record = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } })
    if (!record || record.revokedAt || record.expiresAt <= new Date()) {
      throw ApiException.unauthorized('Your session has expired. Please sign in again.')
    }
    if (record.tokenHash !== this.hashToken(refreshToken)) {
      throw ApiException.unauthorized('Invalid refresh token.')
    }

    const publicUser = await this.toPublic(record.userId)
    const tokens = await this.issueTokens(publicUser)

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date(), replacedById: randomUUID() },
    }).catch(() => undefined)

    return { user: publicUser, tokens }
  }

  /** Issues a fresh token pair, persisting the refresh token for rotation. */
  async issueTokens(user: PublicUser): Promise<TokenPair> {
    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role, type: 'access' as const },
      { secret: this.accessSecret(), expiresIn: this.accessTtl() }
    )

    const refreshId = randomUUID()
    const rawRefresh = this.jwt.sign(
      { sub: user.id, role: user.role, type: 'refresh' as const, jti: refreshId },
      { secret: this.refreshSecret(), expiresIn: this.refreshTtl() }
    )

    await this.prisma.refreshToken.create({
      data: {
        id: refreshId,
        userId: user.id,
        tokenHash: this.hashToken(rawRefresh),
        expiresAt: new Date(Date.now() + this.refreshTtlSeconds() * 1000),
      },
    })

    return { accessToken, refreshToken: rawRefresh }
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return
    let payload: RefreshTokenPayload | null = null
    try {
      payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, { secret: this.refreshSecret() })
    } catch {
      return
    }
    if (!payload?.jti) return
    await this.prisma.refreshToken
      .update({ where: { id: payload.jti }, data: { revokedAt: new Date() } })
      .catch(() => undefined)
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ sent: boolean; resetToken?: string }> {
    const email = dto.email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user || user.deletedAt) {
      return { sent: false }
    }
    const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '')
    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })
    return this.config.get('isProd') ? { sent: true } : { sent: true, resetToken: token }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const record = await this.prisma.authToken.findFirst({
      where: { type: 'PASSWORD_RESET', tokenHash: this.hashToken(token) },
    })
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw ApiException.notFound('INVALID_TOKEN', 'This reset link is invalid or has expired.')
    }
    const passwordHash = await argon2.hash(password)
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId },
        data: { revokedAt: new Date() },
      }),
    ])
  }

  async me(userId: string): Promise<PublicUser> {
    return this.toPublic(userId)
  }

  private async toPublic(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: PUBLIC_SELECT })
    if (!user) throw ApiException.notFound('NOT_FOUND', 'Account not found.')
    return user
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private accessSecret(): string {
    return this.config.get<string>('jwt.accessSecret') || 'dev-access-secret'
  }

  private refreshSecret(): string {
    return this.config.get<string>('jwt.refreshSecret') || 'dev-refresh-secret'
  }

  private accessTtl(): string {
    return this.config.get<string>('jwt.accessTtl') || '15m'
  }

  private refreshTtl(): string {
    return this.config.get<string>('jwt.refreshTtl') || '30d'
  }

  private refreshTtlSeconds(): number {
    const value = this.config.get<string>('jwt.refreshTtl') || '30d'
    const match = /^(\d+)(s|m|h|d|w)$/.exec(value.trim())
    if (!match) return 30 * 86400
    const n = parseInt(match[1], 10)
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 }
    return n * (multipliers[match[2]] || 1)
  }
}