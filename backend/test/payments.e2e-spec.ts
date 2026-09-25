import { INestApplication } from '@nestjs/common'
import {
  agent,
  bootApp,
  listRestaurantFoods,
  login,
  pickRestaurant,
} from './utils'

describe('Payments (e2e)', () => {
  let app: INestApplication
  let customer: string

  beforeAll(async () => {
    app = await bootApp()
    customer = await login(app, 'demo@lunchup.com', 'lunchup123')
    await agent(app).delete('/api/v1/cart/clear').set('Cookie', customer)
  })

  afterAll(async () => {
    await app.close()
  })

  async function seedMomoOrder() {
    const restaurant = await pickRestaurant(app, 0)
    const food = (await listRestaurantFoods(app, restaurant.id))[0]
    await agent(app).post('/api/v1/cart/items').set('Cookie', customer).send({ foodId: food.id, quantity: 1 })

    return agent(app)
      .post('/api/v1/orders')
      .set('Cookie', customer)
      .send({
        deliveryMethod: 'standard',
        paymentMethod: 'mobile_money',
        deliveryAddress: { name: 'Demo', phone: '0241234567', address: '12 Ring Road', city: 'Accra' },
      })
      .expect(201)
  }

  it('creates a pending order for online payment and allows verification', async () => {
    const res = await seedMomoOrder()
    expect(res.body.data.status).toBe('pending')
    expect(res.body.data.statusRaw).toBe('PENDING_PAYMENT')
    expect(res.body.data.paymentStatus).toBe('pending')

    const initiated = await agent(app)
      .post('/api/v1/payments/initiate')
      .set('Cookie', customer)
      .send({ orderId: res.body.data.id, method: 'mobile_money', details: { accountNumber: '0241111111' } })
      .expect(201)

    expect(initiated.body.data.status).toBe('PENDING')
    expect(initiated.body.data.reference).toBeDefined()
    expect(initiated.body.data.provider).toBe('sandbox_momo')

    const verified = await agent(app)
      .post('/api/v1/payments/verify')
      .set('Cookie', customer)
      .send({ orderId: initiated.body.data.orderId, reference: initiated.body.data.reference })
      .expect(201)

    expect(verified.body.data.status).toBe('success')
    expect(verified.body.data.order.statusRaw).toBe('PAID')
    expect(verified.body.data.order.status).toBe('confirmed')
    expect(verified.body.data.order.paymentStatus).toBe('success')
  })

  it('fails verification for a flagged account and keeps the order pending', async () => {
    const created = await seedMomoOrder()
    const orderId = created.body.data.id

    const initiated = await agent(app)
      .post('/api/v1/payments/initiate')
      .set('Cookie', customer)
      .send({ orderId, method: 'mobile_money', details: { accountNumber: '0241200000' } })
      .expect(201)

    const verified = await agent(app)
      .post('/api/v1/payments/verify')
      .set('Cookie', customer)
      .send({ orderId, reference: initiated.body.data.reference })
      .expect(201)

    expect(verified.body.data.status).toBe('failed')

    const detail = await agent(app).get(`/api/v1/orders/${orderId}`).set('Cookie', customer).expect(200)
    expect(detail.body.data.statusRaw).toBe('PENDING_PAYMENT')
    expect(detail.body.data.paymentStatus).toBe('pending')
  })

  it('does not allow initiating payment twice on one order', async () => {
    const created = await seedMomoOrder()
    const orderId = created.body.data.id

    await agent(app)
      .post('/api/v1/payments/initiate')
      .set('Cookie', customer)
      .send({ orderId, method: 'card', details: { cardLast4: '4242' } })
      .expect(201)

    // a second initiate reuses the pending reference
    const second = await agent(app)
      .post('/api/v1/payments/initiate')
      .set('Cookie', customer)
      .send({ orderId, method: 'card', details: { cardLast4: '9999' } })
      .expect(201)

    expect(second.body.data.requiresVerification).toBe(true)
    expect(second.body.data.status).toBe('PENDING')
  })
})