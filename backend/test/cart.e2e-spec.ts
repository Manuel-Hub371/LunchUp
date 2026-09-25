import { INestApplication } from '@nestjs/common'
import {
  agent,
  bootApp,
  listRestaurantFoods,
  login,
  pickRestaurant,
  unitPriceFor,
} from './utils'

describe('Cart (e2e)', () => {
  let app: INestApplication
  let cookies: string

  beforeAll(async () => {
    app = await bootApp()
    cookies = await login(app, 'demo@lunchup.com', 'lunchup123')
    await agent(app).delete('/api/v1/cart/clear').set('Cookie', cookies)
  })

  afterAll(async () => {
    await app.close()
  })

  it('adds an item with a server-computed unit price', async () => {
    const restaurant = await pickRestaurant(app, 0)
    const food = (await listRestaurantFoods(app, restaurant.id))[0]

    const res = await agent(app)
      .post('/api/v1/cart/items')
      .set('Cookie', cookies)
      .send({ foodId: food.id, quantity: 2 })
      .expect(201)

    expect(res.body.success).toBe(true)
    const cart = res.body.data
    expect(cart.restaurant.id).toBe(restaurant.id)
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].unitPrice).toBe(unitPriceFor(food))
    expect(cart.items[0].lineTotal).toBe(unitPriceFor(food) * 2)
    expect(cart.totals.subtotal).toBe(unitPriceFor(food) * 2)
    expect(cart.totals.deliveryFee).toBe(10)
  })

  it('rejects items from a second restaurant with CART_CONFLICT', async () => {
    const restaurantA = await pickRestaurant(app, 0)
    const restaurantB = await pickRestaurant(app, 1)
    expect(restaurantA.id).not.toBe(restaurantB.id)

    const foodB = (await listRestaurantFoods(app, restaurantB.id))[0]

    const res = await agent(app)
      .post('/api/v1/cart/items')
      .set('Cookie', cookies)
      .send({ foodId: foodB.id, quantity: 1 })
      .expect(409)

    expect(res.body.error.code).toBe('CART_CONFLICT')
  })

  it('updates quantity and recomputes totals', async () => {
    const cartRes = await agent(app).get('/api/v1/cart').set('Cookie', cookies).expect(200)
    const itemId = cartRes.body.data.items[0].itemId
    const unit = cartRes.body.data.items[0].unitPrice

    const res = await agent(app)
      .patch(`/api/v1/cart/items/${itemId}`)
      .set('Cookie', cookies)
      .send({ quantity: 3 })
      .expect(200)

    expect(res.body.data.items[0].quantity).toBe(3)
    expect(res.body.data.totals.subtotal).toBe(unit * 3)
  })

  it('removes the item and reports an empty cart', async () => {
    const cartRes = await agent(app).get('/api/v1/cart').set('Cookie', cookies).expect(200)
    const itemId = cartRes.body.data.items[0].itemId

    const res = await agent(app)
      .delete(`/api/v1/cart/items/${itemId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(res.body.data.hasItems).toBe(false)
    expect(res.body.data.items).toHaveLength(0)
  })

  it('requires authentication', async () => {
    await agent(app).get('/api/v1/cart').expect(401)
  })
})