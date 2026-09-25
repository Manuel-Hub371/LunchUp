/* eslint-disable no-console */
import { PrismaClient, Role } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@lunchup.com' } })
  if (existing) {
    console.log('Seed already applied — skipping (re-run with a fresh DB to reseed).')
    return
  }

  const hash = (password: string) => argon2.hash(password)

  /* ------------------------------------------------------------------ *
   * Users
   * ------------------------------------------------------------------ */
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@lunchup.com',
      passwordHash: await hash('Admin@123'),
      name: 'LunchUp Admin',
      role: Role.ADMIN,
      phone: '+233 20 000 0001',
      emailVerifiedAt: new Date(),
    },
  })

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@lunchup.com',
      passwordHash: await hash('lunchup123'),
      name: 'Demo Customer',
      role: Role.CUSTOMER,
      phone: '+233 24 000 0000',
      emailVerifiedAt: new Date(),
      customerProfile: { create: { location: 'East Legon' } },
      addresses: {
        create: [
          {
            label: 'Home',
            name: 'Demo Customer',
            phone: '+233 24 000 0000',
            line1: '14 Boundary Road',
            landmark: 'Beside the Total fuel station',
            city: 'Accra',
            isDefault: true,
          },
          {
            label: 'Work',
            name: 'Demo Customer',
            phone: '+233 24 000 0000',
            line1: '43 Oxford Street',
            landmark: 'Opposite the pharmacy',
            city: 'Accra',
          },
        ],
      },
    },
  })

  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor@lunchup.com',
      passwordHash: await hash('vendor123'),
      name: 'Auntie Esi',
      role: Role.VENDOR,
      phone: '+233 26 000 0000',
      emailVerifiedAt: new Date(),
      vendorProfile: {
        create: {
          businessName: 'Auntie Esi Foods',
          description: 'Home-style Ghanaian meals made with love.',
          phone: '+233 26 000 0000',
          email: 'vendor@lunchup.com',
          status: 'APPROVED',
        },
      },
    },
  })

  const vendorProfile = await prisma.vendorProfile.findUniqueOrThrow({
    where: { userId: vendorUser.id },
  })

  /* ------------------------------------------------------------------ *
   * Categories (slug = frontend term where possible)
   * ------------------------------------------------------------------ */
  const categoryDefs = [
    { name: 'Local Dishes', slug: 'local-dishes', term: 'local', description: 'Home-style rice, stews and traditional plates made the authentic way.' },
    { name: 'Fast Food', slug: 'fast-food', term: 'fastfood', description: 'Burgers, wings, pizza and everything quick and craveable.' },
    { name: 'Continental', slug: 'continental', term: 'continental', description: 'International favourites from pasta and bowls to smokey grills.' },
    { name: 'Snacks', slug: 'snacks', term: 'snacks', description: 'Bites between meals — suya, fries and street classics.' },
    { name: 'Drinks', slug: 'drinks', term: 'drinks', description: 'Fresh juices, smoothies and cold drinks to go with your meal.' },
    { name: 'Desserts', slug: 'desserts', term: 'desserts', description: 'Cakes, puddings and sweet finishes for every mood.' },
  ]
  const categoryMap = new Map<string, string>()
  const foodCategoryIds: Record<string, string> = {}
  for (const def of categoryDefs) {
    const created = await prisma.foodCategory.create({
      data: { name: def.name, slug: def.slug, image: img(`cat-${def.slug}`), description: def.description },
    })
    categoryMap.set(def.slug, created.id)
    foodCategoryIds[def.term] = created.id
  }

  /* ------------------------------------------------------------------ *
   * Restaurants
   * ------------------------------------------------------------------ */
  const restaurantDefs = [
    { name: 'Auntie Esi Kitchen', location: 'East Legon', featured: true, verified: true, rating: 4.8, reviewCount: 214, deliveryFee: 10, deliveryTimeMin: 30, popularity: 980, opensAt: '10:00 AM', closesAt: '10:00 PM', categories: ['local-dishes', 'continental'], term: 'local' },
    { name: 'Jollof Republic', location: 'Osu', featured: true, verified: true, rating: 4.7, reviewCount: 168, deliveryFee: 10, deliveryTimeMin: 25, popularity: 860, opensAt: '11:00 AM', closesAt: '11:00 PM', categories: ['local-dishes'], term: 'local' },
    { name: 'Pizza Slice Cafe', location: 'Madina', featured: true, verified: true, rating: 4.5, reviewCount: 132, deliveryFee: 12, deliveryTimeMin: 35, popularity: 720, opensAt: '12:00 PM', closesAt: '11:00 PM', categories: ['fast-food'], term: 'fastfood' },
    { name: 'Spicy Grill House', location: 'Spintex', featured: false, verified: true, rating: 4.6, reviewCount: 98, deliveryFee: 12, deliveryTimeMin: 40, popularity: 640, opensAt: '2:00 PM', closesAt: '12:00 AM', categories: ['continental'], term: 'continental' },
    { name: 'Snack Avenue', location: 'Adenta', featured: false, verified: false, rating: 4.3, reviewCount: 76, deliveryFee: 8, deliveryTimeMin: 30, popularity: 510, opensAt: '10:00 AM', closesAt: '9:00 PM', categories: ['snacks', 'drinks'], term: 'snacks' },
    { name: 'De Classy Fast Food', location: 'Labadi', featured: false, verified: true, rating: 4.4, reviewCount: 121, deliveryFee: 14, deliveryTimeMin: 35, popularity: 590, opensAt: '11:00 AM', closesAt: '11:00 PM', categories: ['fast-food', 'snacks'], term: 'fastfood' },
    { name: 'Sweet Finish', location: 'Airport Residential', featured: false, verified: false, rating: 4.2, reviewCount: 64, deliveryFee: 10, deliveryTimeMin: 30, popularity: 430, opensAt: '9:00 AM', closesAt: '9:00 PM', categories: ['desserts', 'drinks'], term: 'desserts' },
  ]

  const restaurantMap = new Map<string, string>()
  for (const def of restaurantDefs) {
    const restaurant = await prisma.restaurant.create({
      data: {
        vendorProfileId: vendorProfile.id,
        name: def.name,
        slug: def.name.toLowerCase().replace(/\s+/g, '-'),
        description: `${def.name} — serving delicious food in ${def.location}.`,
        location: def.location,
        rating: def.rating,
        reviewCount: def.reviewCount,
        deliveryFee: def.deliveryFee,
        deliveryTimeMin: def.deliveryTimeMin,
        popularity: def.popularity,
        opensAt: def.opensAt,
        closesAt: def.closesAt,
        featured: def.featured,
        verified: def.verified,
        isOpen: true,
        status: 'APPROVED',
        services: ['dine-in', 'takeaway', 'delivery'],
        categories: {
          create: def.categories.map((slug) => ({ categoryId: categoryMap.get(slug)! })),
        },
        openingHours: {
          create: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => ({
            day: day as 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN',
            openTime: def.opensAt,
            closeTime: def.closesAt,
            isClosed: false,
          })),
        },
      },
    })
    restaurantMap.set(def.name, restaurant.id)
  }

  const restId = (name: string) => restaurantMap.get(name)!

  /* ------------------------------------------------------------------ *
   * Foods
   * ------------------------------------------------------------------ */
  const foodDefs = [
    { name: 'Smoky Jollof Rice & Chicken', restaurant: 'Auntie Esi Kitchen', term: 'local', price: 45, discount: 15, rating: 4.9, reviewCount: 120, popularity: 980, featured: true, deliveryTime: 25, includedItems: ['Smoky jollof rice', 'Grilled chicken', 'Shito & salad'], customization: [
      { name: 'Protein', required: true, min: 1, max: 1, options: [
        { name: 'Grilled chicken', modifier: 0, isDefault: true },
        { name: 'Fried chicken', modifier: 5 },
        { name: 'Beef', modifier: 8 },
        { name: 'Fish', modifier: 10 },
      ]},
      { name: 'Spice level', required: false, min: 0, max: 1, options: [
        { name: 'Mild', modifier: 0 },
        { name: 'Medium', modifier: 0, isDefault: true },
        { name: 'Extra hot', modifier: 0 },
      ]},
    ] },
    { name: 'Waakye with Shito & Egg', restaurant: 'Jollof Republic', term: 'local', price: 35, discount: 0, rating: 4.8, reviewCount: 95, popularity: 880, featured: false, deliveryTime: 20, includedItems: ['Waakye rice', 'Shito', 'Boiled egg', 'Spaghetti'], customization: [
      { name: 'Protein', required: true, min: 1, max: 2, options: [
        { name: 'Boiled egg', modifier: 0, isDefault: true },
        { name: 'Beef', modifier: 10 },
        { name: 'Sausage', modifier: 8 },
        { name: 'Fish', modifier: 12 },
      ]},
    ] },
    { name: 'Banku & Okro Stew', restaurant: 'Auntie Esi Kitchen', term: 'local', price: 40, discount: 0, rating: 4.6, reviewCount: 60, popularity: 540, featured: false, deliveryTime: 30, includedItems: ['Banku', 'Okro stew', 'Tilapia'] },
    { name: 'Beef Burger & Fries', restaurant: 'Pizza Slice Cafe', term: 'fastfood', price: 38, discount: 0, rating: 4.4, reviewCount: 88, popularity: 720, featured: true, deliveryTime: 20, includedItems: ['Quarter pound burger', 'Fries', 'Coleslaw'], customization: [
      { name: 'Sides', required: false, min: 0, max: 1, options: [
        { name: 'Regular fries', modifier: 0, isDefault: true },
        { name: 'Cheese fries', modifier: 6 },
        { name: 'Onion rings', modifier: 8 },
      ]},
    ] },
    { name: 'Pepperoni Pizza (Medium)', restaurant: 'Pizza Slice Cafe', term: 'fastfood', price: 68, discount: 10, rating: 4.5, reviewCount: 110, popularity: 690, featured: false, deliveryTime: 30, includedItems: ['10-inch pizza', 'Garlic dip'], customization: [
      { name: 'Extra toppings', required: false, min: 0, max: 3, options: [
        { name: 'Extra cheese', modifier: 8 },
        { name: 'Mushrooms', modifier: 5 },
        { name: 'Bacon', modifier: 12 },
        { name: 'Jalapeños', modifier: 4 },
      ]},
    ] },
    { name: 'Grilled Chicken Wings (6)', restaurant: 'Spicy Grill House', term: 'continental', price: 42, discount: 0, rating: 4.7, reviewCount: 70, popularity: 580, featured: false, deliveryTime: 25, includedItems: ['6 wings', 'Sauce of choice', 'Fries'], customization: [
      { name: 'Sauce', required: true, min: 1, max: 1, options: [
        { name: 'Barbecue', modifier: 0, isDefault: true },
        { name: 'Honey mustard', modifier: 0 },
        { name: 'Peri-peri', modifier: 2 },
      ]},
    ] },
    { name: 'Chicken Shish Kebab', restaurant: 'Spicy Grill House', term: 'continental', price: 36, discount: 0, rating: 4.5, reviewCount: 48, popularity: 420, featured: false, deliveryTime: 25, includedItems: ['2 skewers', 'Garlic sauce', 'Pitta'] },
    { name: 'Suya Bites & Fries', restaurant: 'Snack Avenue', term: 'snacks', price: 25, discount: 0, rating: 4.3, reviewCount: 55, popularity: 470, featured: false, deliveryTime: 15, includedItems: ['Beef suya sticks', 'Spicy kuli-kuli', 'Fries'] },
    { name: 'Chicken Kebab & Chips', restaurant: 'De Classy Fast Food', term: 'fastfood', price: 32, discount: 0, rating: 4.2, reviewCount: 82, popularity: 390, featured: false, deliveryTime: 20, includedItems: ['Grilled kebab', 'Chips', 'Shito'] },
    { name: 'Fresh Fruit Juice (Pineapple)', restaurant: 'Snack Avenue', term: 'drinks', price: 18, discount: 0, rating: 4.6, reviewCount: 44, popularity: 360, featured: false, deliveryTime: 10, includedItems: ['600ml juice'] },
    { name: 'Mango Smoothie', restaurant: 'Snack Avenue', term: 'drinks', price: 22, discount: 0, rating: 4.5, reviewCount: 39, popularity: 330, featured: false, deliveryTime: 10, includedItems: ['500ml smoothie'] },
    { name: 'Chocolate Brownie', restaurant: 'Sweet Finish', term: 'desserts', price: 20, discount: 0, rating: 4.4, reviewCount: 57, popularity: 410, featured: false, deliveryTime: 15, includedItems: ['Brownie', 'Vanilla drizzle'] },
    { name: 'Waakye Bowl (Chicken)', restaurant: 'Jollof Republic', term: 'local', price: 38, discount: 0, rating: 4.7, reviewCount: 74, popularity: 620, featured: false, deliveryTime: 20, includedItems: ['Waakye', 'Grilled chicken', 'Shito', 'Avocado'] },
  ]

  const foodIds: string[] = []
  for (const def of foodDefs) {
    const food = await prisma.food.create({
      data: {
        restaurantId: restId(def.restaurant),
        name: def.name,
        description: `${def.name} — freshly prepared and delivered hot.`,
        price: def.price,
        discount: def.discount,
        image: img(def.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)),
        images: [img(def.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-2')],
        categoryId: foodCategoryIds[def.term],
        categoryTerm: def.term,
        deliveryTimeMin: def.deliveryTime,
        includedItems: def.includedItems,
        available: true,
        featured: def.featured,
        popularity: def.popularity,
        rating: def.rating,
        reviewCount: def.reviewCount,
        customizationGroups: def.customization
          ? {
              create: def.customization.map((group, gi) => ({
                name: group.name,
                required: group.required,
                minSelections: group.min,
                maxSelections: group.max,
                sortOrder: gi,
                options: {
                  create: group.options.map((option, oi) => ({
                    name: option.name,
                    priceModifier: option.modifier,
                    isDefault: option.isDefault || false,
                    available: true,
                    sortOrder: oi,
                  })),
                },
              })),
            }
          : undefined,
      },
    })
    foodIds.push(food.id)
  }

  /* ------------------------------------------------------------------ *
   * Deals
   * ------------------------------------------------------------------ */
  const jollof = await prisma.food.findFirst({ where: { name: 'Smoky Jollof Rice & Chicken' } })
  const pizza = await prisma.food.findFirst({ where: { name: 'Pepperoni Pizza (Medium)' } })
  if (jollof) {
    await prisma.deal.create({
      data: {
        restaurantId: jollof.restaurantId,
        foodId: jollof.id,
        discount: 15,
        label: '15% off Smoky Jollof',
        originalPrice: jollof.price,
        status: 'ACTIVE',
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    })
  }
  if (pizza) {
    await prisma.deal.create({
      data: {
        restaurantId: pizza.restaurantId,
        foodId: pizza.id,
        discount: 10,
        label: '10% off Medium Pizza',
        originalPrice: pizza.price,
        status: 'ACTIVE',
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    })
  }

  /* ------------------------------------------------------------------ *
   * Coupons
   * ------------------------------------------------------------------ */
  await prisma.coupon.createMany({
    data: [
      { code: 'LUNCH10', type: 'PERCENT', value: 10, minSubtotal: 50, maxDiscount: 25, label: '10% off orders over GH₵50', isActive: true },
      { code: 'FIRST20', type: 'PERCENT', value: 20, minSubtotal: 30, maxDiscount: 30, label: '20% off your first order', isActive: true },
      { code: 'FREEDEL', type: 'FIXED', value: 10, minSubtotal: 80, label: 'Free delivery on orders over GH₵80', isActive: true },
    ],
  })

  /* ------------------------------------------------------------------ *
   * A couple of pre-seeded reviews
   * ------------------------------------------------------------------ */
  const demoRestaurant = await prisma.restaurant.findFirst({ where: { location: 'East Legon' } })
  if (demoRestaurant) {
    await prisma.review.create({
      data: {
        userId: demoUser.id,
        restaurantId: demoRestaurant.id,
        rating: 5,
        comment: 'Great food and fast delivery. Ordering was very easy and the app is super intuitive.',
        customerNameSnapshot: 'Demo Customer',
        status: 'APPROVED',
      },
    })
  }

  console.log('Seed complete.')
  console.log('Admin  → admin@lunchup.com / Admin@123')
  console.log('Vendor → vendor@lunchup.com / vendor123')
  console.log('Customer → demo@lunchup.com / lunchup123')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })