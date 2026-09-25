import { INestApplication } from '@nestjs/common'
import {
  agent,
  bootApp,
  listRestaurantFoods,
  login,
  pickRestaurant,
} from './utils'

describe('Reviews (e2e)', () => {
  let app: INestApplication
  let customer: string
  let vendor: string

  beforeAll(async () => {
    app = await bootApp()
    customer = await login(app, 'demo@lunchup.com', 'lunchup123')
    vendor = await login(app, 'vendor@lunchup.com', 'vendor123')
    await agent(app).delete('/api/v1/cart/clear').set('Cookie', customer)
  })

  afterAll(async () => {
    await app.close()
  })

  it('reviews an order only after it is delivered', async () => {
    const restaurant = await pickRestaurant(app, 0)
    const food = (await listRestaurantFoods(app, restaurant.id))[0]
    await agent(app).post('/api/v1/cart/items').set('Cookie', customer).send({ foodId: food.id, quantity: 1 })

    const created = await agent(app)
      .post('/api/v1/orders')
      .set('Cookie', customer)
      .send({
        deliveryMethod: 'standard',
        paymentMethod: 'pay_on_delivery',
        deliveryAddress: { name: 'Demo', phone: '0241234567', address: '12 Ring Road', city: 'Accra' },
      })
      .expect(201)
    const orderId = created.body.data.id

    // Not delivered yet: 409
    const tooEarly = await agent(app)
      .post('/api/v1/reviews')
      .set('Cookie', customer)
      .send({ restaurantId: restaurant.id, orderId, rating: 5, comment: 'Great!' })
    expect(tooEarly.status).toBe(409)

    // Vendor walks the order to DELIVERED
    await agent(app)
      .patch(`/api/v1/vendor/orders/${orderId}/status`)
      .set('Cookie', vendor)
      .send({ status: 'PREPARING' })
      .expect(200)
    await agent(app)
      .patch(`/api/v1/vendor/orders/${orderId}/status`)
      .set('Cookie', vendor)
      .send({ status: 'READY' })
      .expect(200)
    await agent(app)
      .patch(`/api/v1/vendor/orders/${orderId}/status`)
      .set('Cookie', vendor)
      .send({ status: 'OUT_FOR_DELIVERY' })
      .expect(200)
    await agent(app)
      .patch(`/api/v1/vendor/orders/${orderId}/status`)
      .set('Cookie', vendor)
      .send({ status: 'DELIVERED' })
      .expect(200)

    const review = await agent(app)
      .post('/api/v1/reviews')
      .set('Cookie', customer)
      .send({ restaurantId: restaurant.id, orderId, rating: 5, comment: 'Great food' })
      .expect(201)

    expect(review.body.data.rating).toBe(5)
    expect(review.body.data.comment).toBe('Great food')

    // Listed publicly after approval
    const list = await agent(app)
      .get('/api/v1/reviews')
      .query({ restaurantId: restaurant.id })
      .expect(200)
    const ids = (list.body.data as { id: string }[]).map((r) => r.id)
    expect(ids).toContain(review.body.data.id)
  })

  it('vendor sees reviews for owned restaurants', async () => {
    const res = await agent(app).get('/api/v1/vendor/reviews').set('Cookie', vendor).expect(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})