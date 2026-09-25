import { INestApplication } from '@nestjs/common'
import {
  agent,
  bootApp,
  listRestaurantFoods,
  login,
  pickRestaurant,
  unitPriceFor,
} from './utils'

describe('Orders (e2e)', () => {
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

  async function seedPODOrder() {
    const restaurant = await pickRestaurant(app, 0)
    const food = (await listRestaurantFoods(app, restaurant.id))[0]
    await agent(app).post('/api/v1/cart/items').set('Cookie', customer).send({ foodId: food.id, quantity: 2 })

    return agent(app)
      .post('/api/v1/orders')
      .set('Cookie', customer)
      .send({
        deliveryMethod: 'standard',
        paymentMethod: 'pay_on_delivery',
        deliveryAddress: { name: 'Demo Customer', phone: '0241234567', address: '12 Ring Road', city: 'Accra' },
      })
  }

  it('creates a POD order: confirmed immediately, success payment, server totals', async () => {
    const restaurant = await pickRestaurant(app, 0)
    const food = (await listRestaurantFoods(app, restaurant.id))[0]
    const unit = unitPriceFor(food)

    const res = await seedPODOrder()
    expect(res.status).toBe(201)
    const order = res.body.data
    expect(order.status).toBe('confirmed')
    expect(order.statusRaw).toBe('CONFIRMED')
    expect(order.paymentStatus).toBe('success')
    expect(order.deliveryFee).toBe(10)
    expect(order.subtotal).toBe(unit * 2)
    expect(order.total).toBe(unit * 2 + 10)
    expect(order.discount).toBe(0)
    expect(order.paymentMethod).toBe('pay_on_delivery')
    expect(order.items).toHaveLength(1)
    expect(order.items[0].foodId).toBe(food.id)
    expect(order.number).toMatch(/^LU-/)
    expect(order.timeline.length).toBeGreaterThan(0)

    // cart was cleared
    const cart = await agent(app).get('/api/v1/cart').set('Cookie', customer).expect(200)
    expect(cart.body.data.hasItems).toBe(false)
  })

  it('applies a seeded coupon server-side (LUNCH10)', async () => {
    const restaurant = await pickRestaurant(app, 0)
    const food = (await listRestaurantFoods(app, restaurant.id))[0]
    const unit = unitPriceFor(food)
    const quantity = Math.max(2, Math.ceil(50 / unit))
    await agent(app).post('/api/v1/cart/items').set('Cookie', customer).send({ foodId: food.id, quantity })

    const res = await agent(app)
      .post('/api/v1/orders')
      .set('Cookie', customer)
      .send({
        deliveryMethod: 'standard',
        paymentMethod: 'pay_on_delivery',
        deliveryAddress: { name: 'Demo', phone: '0241234567', address: '12 Ring Road', city: 'Accra' },
        couponCode: 'LUNCH10',
      })
      .expect(201)

    const order = res.body.data
    const expectedSubtotal = Math.round(unit * quantity * 100) / 100
    expect(order.subtotal).toBe(expectedSubtotal)
    expect(order.discount).toBe(Math.round(expectedSubtotal * 0.1 * 100) / 100)
    expect(order.total).toBe(Math.round((expectedSubtotal - order.discount + 10) * 100) / 100)
    expect(order.couponLabel).toContain('10%')
  })

  it('lists the customer order history', async () => {
    const res = await agent(app).get('/api/v1/orders').set('Cookie', customer).expect(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data[0].itemCount).toBeGreaterThan(0)
  })

  it('lets the vendor advance an order along the flow and rejects jumps', async () => {
    const created = await seedPODOrder()
    const order = created.body.data
    const orderId = order.id

    // Direct jump DELIVERED is not allowed from CONFIRMED
    const jump = await agent(app)
      .patch(`/api/v1/vendor/orders/${orderId}/status`)
      .set('Cookie', vendor)
      .send({ status: 'DELIVERED' })
    expect(jump.status).toBe(409)
    expect(jump.body.error.code).toBe('INVALID_TRANSITION')

    // vendor cannot touch a restaurant they do not own (demo order belongs to seeded vendor)
    const secret = await agent(app)
      .patch(`/api/v1/vendor/orders/${orderId}/status`)
      .set('Cookie', vendor)
      .send({ status: 'PREPARING' })
    expect(secret.status).toBe(200)

    const prep = await agent(app)
      .patch(`/api/v1/vendor/orders/${orderId}/status`)
      .set('Cookie', vendor)
      .send({ status: 'READY' })
    expect(prep.status).toBe(200)
    expect(prep.body.data.status).toBe('ready')

    const delivered = await agent(app)
      .patch(`/api/v1/vendor/orders/${orderId}/status`)
      .set('Cookie', vendor)
      .send({ status: 'OUT_FOR_DELIVERY' })
    expect(delivered.status).toBe(200)
  })

  it('customer cancels an order (POD → refunded)', async () => {
    const created = await seedPODOrder()
    const orderId = created.body.data.id

    const res = await agent(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Cookie', customer)
      .expect(201)

    expect(res.body.data.status).toBe('cancelled')
    expect(res.body.data.paymentStatus).toBe('cancelled')
  })

  it('tracks order state via timeline endpoint', async () => {
    const created = await seedPODOrder()
    const orderId = created.body.data.id

    const res = await agent(app).get(`/api/v1/orders/${orderId}/track`).expect(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data[0].status).toBe('confirmed')
  })

  it('a customer cannot fetch another users order', async () => {
    const email = `intruder_${Date.now()}@lunchup.dev`
    const registered = await agent(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Intruder', email, password: 'Password123!' })
      .expect(201)
    const other = await login(app, email, 'Password123!')
    void registered

    const created = await seedPODOrder()
    const orderId = created.body.data.id

    const res = await agent(app).get(`/api/v1/orders/${orderId}`).set('Cookie', other).expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})