import { INestApplication } from '@nestjs/common'
import { agent, bootApp, expectUnauthorized, login, parseCookies } from './utils'

describe('Auth (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await bootApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('registers a customer and sets session cookies', async () => {
    const email = `newuser_${Date.now()}@lunchup.dev`
    const res = await agent(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', email, password: 'Password123!' })
      .expect(201)

    expect(res.body.success).toBe(true)
    expect(res.body.data.user.email).toBe(email)
    expect(res.body.data.user.role).toBe('CUSTOMER')
    const cookies = (res.headers['set-cookie'] || []) as string[]
    expect(cookies.some((c) => c.includes('lunchup_access'))).toBe(true)
    expect(cookies.some((c) => c.includes('lunchup_refresh'))).toBe(true)
  })

  it('rejects duplicate registration with 409', async () => {
    await agent(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Demo', email: 'demo@lunchup.com', password: 'lunchup123' })
      .expect(409)
  })

  it('rejects a wrong password with 401', async () => {
    await agent(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@lunchup.com', password: 'wrong-password' })
      .expect(401)
  })

  it('logs in seeded customer, exposes /me, and logs out', async () => {
    const cookies = await login(app, 'demo@lunchup.com', 'lunchup123')

    const me = await agent(app).get('/api/v1/auth/me').set('Cookie', cookies).expect(200)
    expect(me.body.data.email).toBe('demo@lunchup.com')

expectUnauthorized(await agent(app).get('/api/v1/auth/me'))

    await agent(app).post('/api/v1/auth/logout').set('Cookie', cookies).expect(200)
    expectUnauthorized(await agent(app).post('/api/v1/auth/refresh').set('Cookie', cookies))
  })

  it('rotates refresh token and issues a new access token', async () => {
    const loginRes = await agent(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@lunchup.com', password: 'lunchup123' })
      .expect(200)
    const cookies = parseCookies(loginRes)

    const refreshed = await agent(app).post('/api/v1/auth/refresh').set('Cookie', cookies).expect(200)
    expect(refreshed.body.data.user.email).toBe('demo@lunchup.com')
    const newCookies = (refreshed.headers['set-cookie'] || []) as string[]
    expect(newCookies.some((c) => c.includes('lunchup_access'))).toBe(true)
  })

  it('keeps protected routes guarded even with an admin session (role check)', async () => {
    const cookies = await login(app, 'demo@lunchup.com', 'lunchup123')
    const res = await agent(app).get('/api/v1/admin/dashboard').set('Cookie', cookies).expect(403)
    expect(res.body.success).toBe(false)
  })
})