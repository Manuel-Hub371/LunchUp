import { INestApplication } from '@nestjs/common'
import { agent, bootApp, pickRestaurant } from './utils'

describe('Catalog (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await bootApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('lists seeded categories with expected slugs', async () => {
    const res = await agent(app).get('/api/v1/categories').expect(200)
    expect(res.body.success).toBe(true)
    const slugs = (res.body.data as { slug: string }[]).map((c) => c.slug)
    expect(slugs).toContain('local-dishes')
    expect(slugs).toContain('fast-food')
    expect(slugs).toContain('continental')
    expect(slugs).toContain('snacks')
  })

  it('lists approved restaurants with the envelope shape', async () => {
    const res = await agent(app).get('/api/v1/restaurants?page=1&pageSize=6').expect(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.meta.page).toBe(1)
    expect(res.body.data.length).toBeGreaterThan(0)
    const first = res.body.data[0]
    expect(first.id).toBeDefined()
    expect(first.name).toBeDefined()
    expect(typeof first.deliveryFee).toBe('number')
  })

  it('returns restaurant detail with promotion field', async () => {
    const restaurant = await pickRestaurant(app, 0)
    const res = await agent(app).get(`/api/v1/restaurants/${restaurant.id}`).expect(200)
    expect(res.body.data.id).toBe(restaurant.id)
    expect(res.body.data.promotion).toBeDefined()
  })

  it('lists foods with pricing fields', async () => {
    const res = await agent(app).get('/api/v1/foods?page=1&pageSize=5').expect(200)
    expect(res.body.success).toBe(true)
    const food = res.body.data[0]
    expect(food.price).toBeDefined()
    expect(food.discount).toBeDefined()
    expect(food.vendorId).toBeDefined()
  })

  it('returns an accurate server price-preview for a food', async () => {
    const restaurant = await pickRestaurant(app, 0)
    const foods = (await agent(app)
      .get('/api/v1/foods')
      .query({ restaurantId: restaurant.id, pageSize: 20 })
      .expect(200)).body.data as { id: string; price: number; discount: number }[]

    const food = foods.find((f) => f.price !== undefined)
    expect(food).toBeDefined()

    const res = await agent(app)
      .post('/api/v1/foods/price-preview')
      .send({ foodId: food!.id, quantity: 2 })
      .expect(201)

    const expectedUnit = Math.round((food!.price * (1 - (food!.discount || 0) / 100)) * 100) / 100
    expect(res.body.data.unitPrice).toBe(expectedUnit)
    expect(res.body.data.lineTotal).toBe(expectedUnit * 2)
  })

  it('serves the deals endpoint', async () => {
    const res = await agent(app).get('/api/v1/deals').expect(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('searches restaurants', async () => {
    const res = await agent(app).get('/api/v1/search/restaurants').query({ q: 'a' }).expect(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})