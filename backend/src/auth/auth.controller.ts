import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Response, Request } from 'express'
import { ConfigService } from '@nestjs/config'
import { AuthenticatedUser, CurrentUser, Public } from '../common/decorators'
import { AuthService, PublicUser } from './auth.service'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieBase,
  refreshCookieMaxAge,
  ttlToSeconds,
} from './constants'
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto'
import { RateLimit } from '../common/rate-limit.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService
  ) {}

  private applyCookies(res: Response, result: { tokens: { accessToken: string; refreshToken: string } }) {
    const isProd = this.config.get('isProd')
    const accessMaxAge = ttlToSeconds(this.config.get<string>('jwt.accessTtl') || '15m') * 1000
    const refreshMaxAge =
      refreshCookieMaxAge(ttlToSeconds(this.config.get<string>('jwt.refreshTtl') || '30d')) * 1000
    res.cookie(ACCESS_COOKIE, result.tokens.accessToken, {
      ...cookieBase(isProd),
      path: '/',
      maxAge: accessMaxAge,
    })
    res.cookie(REFRESH_COOKIE, result.tokens.refreshToken, {
      ...cookieBase(isProd),
      path: '/api/v1/auth',
      maxAge: refreshMaxAge,
    })
  }

  private clearCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE)
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' })
  }

  @Public()
  @Post('register')
  @RateLimit({ limit: 20, ttlMs: 60000 })
  @ApiOperation({ summary: 'Create a customer account' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto)
    this.applyCookies(res, result)
    return { user: result.user }
  }

  @Public()
  @Post('login')
  @RateLimit({ limit: 20, ttlMs: 60000 })
  @ApiOperation({ summary: 'Sign in and receive HTTP-only session cookies' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto)
    this.applyCookies(res, result)
    return { user: result.user }
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE]
    const result = await this.auth.refresh(token)
    this.applyCookies(res, result)
    return { user: result.user }
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke the refresh token and clear session cookies' })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE])
    this.clearCookies(res)
    return { message: 'Signed out.' }
  }

  @Public()
  @Post('forgot-password')
  @RateLimit({ limit: 10, ttlMs: 60000 })
  @ApiOperation({ summary: 'Start a password reset for an existing account' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.auth.forgotPassword(dto)
    if (result.sent && result.resetToken && !this.config.get('isProd')) {
      return { sent: true, resetToken: result.resetToken }
    }
    return { sent: result.sent }
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Complete a password reset with a valid token' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token.trim(), dto.password)
    return { message: 'Password updated. You can now sign in.' }
  }

  @Get('me')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Return the authenticated user' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.auth.me(user.id)
  }
}