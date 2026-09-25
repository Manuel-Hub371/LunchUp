import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import { AuthenticatedUser } from '../common/decorators'

export interface JwtAccessPayload {
  sub: string
  email: string
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
  type: 'access'
}

function cookieExtractor(req: Request): string | null {
  if (req?.cookies?.lunchup_access) return req.cookies.lunchup_access
  return null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret') || 'dev-access-secret',
    })
  }

  validate(payload: JwtAccessPayload): AuthenticatedUser {
    if (!payload || payload.type !== 'access' || !payload.sub) {
      throw new UnauthorizedException('Invalid access token')
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role as AuthenticatedUser['role'],
    }
  }
}