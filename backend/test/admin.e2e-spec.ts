import { INestApplication } from '@nestjs/common'
import { agent, bootApp, login } from './utils'

describe('Admin (e2e)', () => {
  let app: INestApplication
  let admin: string
  let vendor: string

  beforeAll(async () => {
    app = await bootApp()
    admin = await login(app, 'admin@lunchup.com', 'Admin@123')
    vendor = await login(app, 'vendor@lunchup.com', 'vendor123')
  })

  afterAll(async () => {
    await app.close()
  })

  it('serves the dashboard summary', async () => {
    const res = await agent(app).get('/api/v1/admin/dashboard').set('Cookie', admin).expect(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.summary.users).toBeGreaterThanOrEqual(3)
    expect(typeof res.body.data.summary.revenue).toBe('number')
    expect(Array.isArray(res.body.data.recentOrders)).toBe(true)
  })

  it('lists users and filters by role', async () => {
    const res = await agent(app)
      .get('/api/v1/admin/users')
      .set('Cookie', admin)
      .query({ role: 'ADMIN' })
      .expect(200)
    const emails = (res.body.data as { email: string }[]).map((u) => u.email)
    expect(emails).toContain('admin@lunchup.com')
  })

  it('creates a category and rejects duplicate slugs', async () => {
    const slug = `test-cat-${Date.now()}`
    const created = await agent(app)
      .post('/api/v1/admin/categories')
      .set('Cookie', admin)
      .send({ name: 'Test Category', slug })
      .expect(201)
    expect(created.body.data.slug).toBe(slug)

    const dup = await agent(app)
      .post('/api/v1/admin/categories')
      .set('Cookie', admin)
      .send({ name: 'Test Category', slug })
      .expect(409)
    expect(dup.body.error.code).toBe('DUPLICATE_SLUG')
  })

  it('walks a restaurant from vendor-submitted to admin-approved', async () => {
    const name = `E2E Kitchen ${Date.now()}`
    const created = await agent(app)
      .post('/api/v1/vendor/restaurants')
      .set('Cookie', vendor)
      .send({ name, description: 'End-to-end test kitchen', location: 'East Legon', deliveryFee: 5 })
      .expect(201)

    const restaurantId = created.body.data.id
    expect(restaurantId).toBeDefined()

    // Hidden (PENDING) from the public catalog
    const publicList = await agent(app).get('/api/v1/restaurants').query({ pageSize: 50 }).expect(200)
    const publicIds = (publicList.body.data as { id: string }[]).map((r) => r.id)
    expect(publicIds).not.toContain(restaurantId)

    // Visible to admin in PENDING
    const pending = await agent(app)
      .get('/api/v1/admin/restaurants')
      .set('Cookie', admin)
      .query({ status: 'PENDING', pageSize: 50 })
      .expect(200)
    const row = (pending.body.data as { id: string; name: string }[]).find((r) => r.id === restaurantId)
    expect(row).toBeDefined()
    expect(row!.name).toBe(name)

    const approved = await agent(app)
      .patch(`/api/v1/admin/restaurants/${restaurantId}/approve`)
      .set('Cookie', admin)
      .send({ note: 'Seeded test approval' })
      .expect(200)
    expect(approved.body.data.status).toBe('APPROVED')
    expect(approved.body.data.verified).toBe(true)

    // Now public
    const after = await agent(app)
      .get('/api/v1/restaurants')
      .query({ search: name, pageSize: 50 })
      .expect(200)
    expect((after.body.data as { id: string }[]).some((r) => r.id === restaurantId)).toBe(true)
  })

  it('rejects a restaurant with a reason', async () => {
    const name = `Rejected Kitchen ${Date.now()}`
    const created = await agent(app)
      .post('/api/v1/vendor/restaurants')
      .set('Cookie', vendor)
      .send({ name, location: 'Osu' })
      .expect(201)

    const rejected = await agent(app)
      .patch(`/api/v1/admin/restaurants/${created.body.data.id}/reject`)
      .set('Cookie', admin)
      .send({ reason: 'Missing health documents' })
      .expect(200)
    expect(rejected.body.data.status).toBe('REJECTED')
  })
})