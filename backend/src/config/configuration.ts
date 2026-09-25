export interface AppConfig {
  env: string
  port: number
  frontendUrl: string
  apiUrl: string
  databaseUrl: string
  testDatabaseUrl: string
  redisUrl: string
  jwt: {
    accessSecret: string
    refreshSecret: string
    accessTtl: string
    refreshTtl: string
  }
  cloudinaryUrl: string
  payment: {
    momoAccountBuilder: string
    cardGateway: string
  }
  logLevel: string
  throttle: {
    ttlMs: number
    limit: number
    authLimit: number
  }
  uploads: {
    dir: string
    maxMb: number
  }
  isProd: boolean
  isTest: boolean
}

export const configuration = (): AppConfig => {
  const env = process.env.NODE_ENV || 'development'
  return {
    env,
    port: parseInt(process.env.PORT || '4000', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:4000',
    databaseUrl: process.env.DATABASE_URL || '',
    testDatabaseUrl: process.env.TEST_DATABASE_URL || '',
    redisUrl: process.env.REDIS_URL || '',
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      accessTtl: process.env.JWT_ACCESS_TTL || '15m',
      refreshTtl: process.env.JWT_REFRESH_TTL || '30d',
    },
    cloudinaryUrl: process.env.CLOUDINARY_URL || '',
    payment: {
      momoAccountBuilder: process.env.PAYMENT_MOMO_ACCOUNT_BUILDER || '',
      cardGateway: process.env.PAYMENT_CARD_GATEWAY || '',
    },
    logLevel: process.env.LOG_LEVEL || 'info',
    throttle: {
      ttlMs: parseInt(process.env.THROTTLE_TTL_MS || '60000', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '120', 10),
      authLimit: parseInt(process.env.AUTH_THROTTLE_LIMIT || '20', 10),
    },
    uploads: {
      dir: process.env.UPLOAD_DIR || './uploads',
      maxMb: parseInt(process.env.MAX_UPLOAD_MB || '5', 10),
    },
    isProd: env === 'production',
    isTest: env === 'test',
  }
}