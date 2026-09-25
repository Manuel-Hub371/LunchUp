import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { bootstrapApp } from '../src/main'

export async function bootApp(): Promise<INestApplication> {
  const app = await bootstrapApp()
  return app
}

export function agent(app: INestApplication) {
  return request(app.getHttpServer())
}

export function parseCookies(res: request.Response): string {
  const cookies = (res.headers['set-cookie'] || []) as string[]
  return cookies.map((cookie) => cookie.split(';')[0]).join('; ')
}

export async function login(
  app: INestApplication,
  email: string,
  password: string
): Promise<string> {
  const res = await agent(app)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200)
  return parseCookies(res)
}

export interface CatalogFood {
  id: string
  name: string
  price: number
  discount: number
  vendorId: string
}

export async function pickRestaurant(app: INestApplication, index = 0) {
  const res = await agent(app).get('/api/v1/restaurants').query({ page: 1, pageSize: 25 }).expect(200)
  expect(res.body.success).toBe(true)
  const restaurants = res.body.data as { id: string; name: string; isOpen: boolean }[]
  expect(restaurants.length).toBeGreaterThan(0)
  return restaurants[index % restaurants.length]
}

export async function listRestaurantFoods(app: INestApplication, restaurantId: string): Promise<CatalogFood[]> {
  const res = await agent(app)
    .get('/api/v1/foods')
    .query({ restaurantId, pageSize: 50, available: 'true' })
    .expect(200)
  const foods = (res.body.data as CatalogFood[]).filter((f) => f.vendorId === restaurantId)
  expect(foods.length).toBeGreaterThan(0)
  return foods
}

export function unitPriceFor(food: CatalogFood): number {
  return Math.round((food.discount > 0 ? food.price * (1 - food.discount / 100) : food.price) * 100) / 100
}

export function expectUnauthorized(res: request.Response) {
  expect(res.status).toBe(401)
  expect(res.body.success).toBe(false)
  expect(res.body.error.code).toBeDefined()
}

export function expectForbidden(res: request.Response) {
  expect(res.status).toBe(403)
  expect(res.body.success).toBe(false)
}