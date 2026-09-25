import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { Public } from '../common/decorators'
import { PrismaService } from '../prisma/prisma.service'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness + database connectivity' })
  async check() {
    const start = Date.now()
    let database = 'up'
    let error: string | undefined
    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch (e) {
      database = 'down'
      error = (e as Error).message
    }
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      service: 'lunchup-api',
      env: this.config.get<string>('NODE_ENV'),
      database,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      ...(error ? { error } : {}),
      latencyMs: Date.now() - start,
    }
  }
}