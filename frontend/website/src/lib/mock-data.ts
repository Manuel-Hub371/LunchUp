/**
 * DEVELOPMENT FALLBACK DATA
 *
 * LunchUp does not have a connected backend API yet. This curated sample
 * dataset powers the whole customer-facing website so the UI can be built
 * against realistic shapes before the API is available.
 *
 * IMPORTANT: This module must be replaced with real API responses once the
 * backend is implemented. Services in src/lib/services consume this data
 * through an async boundary, so swapping to fetch() only requires editing
 * the service modules, never the components.
 *
 * Do not treat these values as production statistics or live offers.
 */

import type {
  Category,
  Coupon,
  Deal,
  DeliveryAddress,
  Food,
  FoodCustomizationGroup,
  Restaurant,
  Review,
} from '@/types'

/* --------------------------- Customization ------------------------ */

const selectionGroup = (
  id: string,
  name: string,
  required: boolean,
  maxSelections: number,
  options: { id: string; name: string; priceModifier: number; available?: boolean; isDefault?: boolean }[]
): FoodCustomizationGroup => ({
  id,
  name,
  required,
  minSelections: required ? 1 : 0,
  maxSelections,
  options: options.map((option) => ({ ...option, available: option.available !== false })),
})

const proteinGroup = (base = 0): FoodCustomizationGroup =>
  selectionGroup('protein', 'Protein', true, 1, [
    { id: 'protein-chicken', name: 'Chicken', priceModifier: base, isDefault: true },
    { id: 'protein-beef', name: 'Beef', priceModifier: base + 10 },
    { id: 'protein-fish', name: 'Fish', priceModifier: base + 5 },
    { id: 'protein-tilapia', name: 'Grilled Tilapia', priceModifier: base + 12 },
  ])

const spiceGroup = (): FoodCustomizationGroup =>
  selectionGroup('spice', 'Spice Level', true, 1, [
    { id: 'spice-mild', name: 'Mild', priceModifier: 0, isDefault: true },
    { id: 'spice-medium', name: 'Medium', priceModifier: 0 },
    { id: 'spice-hot', name: 'Hot', priceModifier: 0 },
  ])

const sizeGroup = (): FoodCustomizationGroup =>
  selectionGroup('size', 'Portion', true, 1, [
    { id: 'size-regular', name: 'Regular', priceModifier: 0, isDefault: true },
    { id: 'size-large', name: 'Large', priceModifier: 10 },
  ])

const extrasGroup = (): FoodCustomizationGroup =>
  selectionGroup('extras', 'Extras', false, 3, [
    { id: 'extra-egg', name: 'Fried Egg', priceModifier: 5 },
    { id: 'extra-plantain', name: 'Fried Plantain', priceModifier: 5 },
    { id: 'extra-salad', name: 'Fresh Salad', priceModifier: 3 },
    { id: 'extra-extra', name: 'Extra Protein', priceModifier: 12 },
  ])

const drinksGroup = (): FoodCustomizationGroup =>
  selectionGroup('drink', 'Add a Drink', false, 1, [
    { id: 'drink-soda', name: 'Soft Drink', priceModifier: 8 },
    { id: 'drink-juice', name: 'Fresh Juice', priceModifier: 12 },
    { id: 'drink-water', name: 'Bottled Water', priceModifier: 5 },
  ])

/* ------------------------------ Food ----------------------------- */

export const foods: Food[] = [
  {
    id: '1',
    name: 'Jollof Rice & Chicken',
    vendor: 'Royal Kitchen',
    vendorId: '1',
    rating: 4.8,
    reviewCount: 124,
    price: 40,
    deliveryTime: '25-35 min',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
      'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80',
    ],
    location: 'East Legon',
    category: 'local',
    featured: true,
    popularity: 95,
    createdAt: '2024-01-15',
    description:
      'Smoky party-style jollof rice served with tender grilled chicken and a side of fresh salad.',
    includedItems: ['Party jollof rice', 'Grilled chicken', 'Fresh salad'],
    customizationGroups: [proteinGroup(), sizeGroup(), extrasGroup(), spiceGroup()],
  },
  {
    id: '2',
    name: 'Waakye',
    vendor: "Mama's Kitchen",
    vendorId: '2',
    rating: 4.7,
    reviewCount: 98,
    price: 35,
    deliveryTime: '25-40 min',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80',
    location: 'Osu',
    category: 'local',
    featured: true,
    popularity: 88,
    createdAt: '2024-01-10',
    description:
      'A hearty bowl of rice and beans served with spaghetti, boiled egg, plantain and shito.',
    includedItems: ['Rice & beans', 'Spaghetti', 'Boiled egg', 'Shito'],
    customizationGroups: [
      selectionGroup('protein', 'Protein', true, 1, [
        { id: 'wk-chicken', name: 'Chicken', priceModifier: 12, isDefault: true },
        { id: 'wk-fish', name: 'Stewed Fish', priceModifier: 10 },
        { id: 'wk-beef', name: 'Beef', priceModifier: 15 },
      ]),
      sizeGroup(),
      extrasGroup(),
      spiceGroup(),
    ],
  },
  {
    id: '3',
    name: 'Banku & Tilapia',
    vendor: 'The Food Lab',
    vendorId: '3',
    rating: 4.6,
    reviewCount: 72,
    price: 45,
    deliveryTime: '30-50 min',
    image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80',
    location: 'East Legon',
    category: 'local',
    featured: true,
    popularity: 82,
    createdAt: '2024-01-12',
    description: 'Fresh grilled tilapia with banku and spicy pepper sauce. A Ghanaian classic.',
    includedItems: ['Banku', 'Grilled tilapia', 'Pepper sauce', 'Fried small pepper'],
    customizationGroups: [
      selectionGroup('serve', 'Banku Style', true, 1, [
        { id: 'banku-plain', name: 'Plain Banku', priceModifier: 0, isDefault: true },
        { id: 'banku-fufu', name: 'Swap for Fufu', priceModifier: 0 },
      ]),
      selectionGroup('sauce', 'Sauce Heat', true, 1, [
        { id: 'sauce-mild', name: 'Mild Pepper', priceModifier: 0, isDefault: true },
        { id: 'sauce-spicy', name: 'Extra Spicy Pepper', priceModifier: 4 },
      ]),
    ],
  },
  {
    id: '4',
    name: 'Chicken Wings',
    vendor: 'Street Bites',
    vendorId: '4',
    rating: 4.5,
    reviewCount: 87,
    price: 40,
    deliveryTime: '20-35 min',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80',
    location: 'Madina',
    category: 'fastfood',
    featured: true,
    popularity: 78,
    discount: 15,
    createdAt: '2024-01-18',
    description: 'Crispy, saucy chicken wings perfect for sharing. Choose mild, spicy or barbecue.',
    includedItems: ['8 chicken wings', 'Dipping sauce', 'Ketchup'],
    customizationGroups: [
      selectionGroup('flavor', 'Wing Flavor', true, 1, [
        { id: 'wing-mild', name: 'Mild', priceModifier: 0, isDefault: true },
        { id: 'wing-spicy', name: 'Spicy', priceModifier: 0 },
        { id: 'wing-bbq', name: 'Barbecue', priceModifier: 0 },
        { id: 'wing-scorching', name: 'Scorching Hot', priceModifier: 2 },
      ]),
      sizeGroup(),
    ],
  },
  {
    id: '5',
    name: 'Classic Party Jollof',
    vendor: 'Royal Kitchen',
    vendorId: '1',
    rating: 4.9,
    reviewCount: 156,
    price: 30,
    deliveryTime: '20-30 min',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80',
    ],
    location: 'East Legon',
    category: 'local',
    popularity: 92,
    discount: 17,
    createdAt: '2024-01-20',
    description: 'A generous plate of classic party jollof rice with garnish.',
    includedItems: ['Party jollof rice', 'Kpakpo shito'],
    customizationGroups: [
      proteinGroup(),
      extrasGroup(),
      spiceGroup(),
      drinksGroup(),
    ],
  },
  {
    id: '6',
    name: 'Grilled Wings & Fries',
    vendor: 'Street Bites',
    vendorId: '4',
    rating: 4.6,
    reviewCount: 91,
    price: 40,
    deliveryTime: '30-40 min',
    image: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=80',
    location: 'Madina',
    category: 'fastfood',
    popularity: 75,
    createdAt: '2024-01-16',
    description: 'Flame-grilled glazed wings served with fries and dipping sauce.',
    includedItems: ['6 grilled wings', 'Salted fries', 'BBQ dip'],
    customizationGroups: [
      selectionGroup('protein', 'Protein', true, 1, [
        { id: 'gf-chicken', name: 'Chicken Wings', priceModifier: 0, isDefault: true },
        { id: 'gf-sausage', name: 'Sausage Platter', priceModifier: 8 },
      ]),
      selectionGroup('dip', 'Dipping Sauce', false, 2, [
        { id: 'dip-bbq', name: 'BBQ', priceModifier: 0 },
        { id: 'dip-garlic', name: 'Garlic Mayo', priceModifier: 2 },
        { id: 'dip-pepper', name: 'Hot Pepper', priceModifier: 0 },
      ]),
    ],
  },
  {
    id: '7',
    name: 'Pepperoni Pizza',
    vendor: 'The Food Lab',
    vendorId: '3',
    rating: 4.4,
    reviewCount: 65,
    price: 60,
    deliveryTime: '35-45 min',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    location: 'East Legon',
    category: 'fastfood',
    popularity: 70,
    discount: 20,
    createdAt: '2024-01-11',
    description: 'Wood-fired pepperoni pizza with a bubbly, charred crust and fresh mozzarella.',
    includedItems: ['12-inch pizza', 'Cheese dust', 'Chilli flakes'],
    customizationGroups: [
      selectionGroup('size', 'Pizza Size', true, 1, [
        { id: 'pz-medium', name: 'Medium (10")', priceModifier: 0, isDefault: true },
        { id: 'pz-large', name: 'Large (14")', priceModifier: 20 },
        { id: 'pz-family', name: 'Family (18")', priceModifier: 35 },
      ]),
      selectionGroup('crust', 'Crust', true, 1, [
        { id: 'crust-classic', name: 'Classic', priceModifier: 0, isDefault: true },
        { id: 'crust-stuffed', name: 'Stuffed', priceModifier: 10 },
      ]),
      selectionGroup('toppings', 'Extra Toppings', false, 4, [
        { id: 'top-extra-cheese', name: 'Extra Cheese', priceModifier: 8 },
        { id: 'top-mushroom', name: 'Mushrooms', priceModifier: 6 },
        { id: 'top-onions', name: 'Onions', priceModifier: 4 },
        { id: 'top-jalapeno', name: 'Jalapeños', priceModifier: 5 },
      ]),
    ],
  },
  {
    id: '8',
    name: 'Fried Rice & Egg',
    vendor: "Mama's Kitchen",
    vendorId: '2',
    rating: 4.3,
    reviewCount: 54,
    price: 35,
    deliveryTime: '30-45 min',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
    location: 'Osu',
    category: 'local',
    popularity: 68,
    createdAt: '2024-01-14',
    description: 'Wok-fried rice with vegetables, egg and your choice of protein.',
    customizationGroups: [proteinGroup(), sizeGroup(), spiceGroup()],
  },
  {
    id: '9',
    name: 'Beef Stew & Rice',
    vendor: 'Royal Kitchen',
    vendorId: '1',
    rating: 4.7,
    reviewCount: 89,
    price: 50,
    deliveryTime: '25-40 min',
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80',
    location: 'East Legon',
    category: 'local',
    popularity: 80,
    discount: 10,
    createdAt: '2024-01-13',
    description: 'Rich, slow-cooked beef stew ladled over fluffy steamed rice.',
    includedItems: ['Steamed rice', 'Beef stew', 'Garden salad'],
    customizationGroups: [proteinGroup(), sizeGroup(), spiceGroup(), drinksGroup()],
  },
  {
    id: '10',
    name: 'Kontomire Stew',
    vendor: 'The Food Lab',
    vendorId: '3',
    rating: 4.5,
    reviewCount: 68,
    price: 40,
    deliveryTime: '25-50 min',
    image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80',
    location: 'East Legon',
    category: 'local',
    popularity: 72,
    discount: 12,
    createdAt: '2024-01-17',
    description: 'Cocoyam leaf stew made with palmin, smoked fish and served with boiled yam.',
    includedItems: ['Boiled yam', 'Kontomire stew', 'Smoked fish'],
    customizationGroups: [
      selectionGroup('swallow', 'Serving', true, 1, [
        { id: 'k-yam', name: 'Boiled Yam', priceModifier: 0, isDefault: true },
        { id: 'k-plantain', name: 'Ripe Plantain', priceModifier: 0 },
        { id: 'k-eko', name: 'Eko (Corn Dough)', priceModifier: 0 },
      ]),
      spiceGroup(),
    ],
  },
  {
    id: '11',
    name: 'Gourmet Burger',
    vendor: 'The Food Lab',
    vendorId: '3',
    rating: 4.5,
    reviewCount: 102,
    price: 45,
    deliveryTime: '25-35 min',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    location: 'East Legon',
    category: 'fastfood',
    popularity: 84,
    createdAt: '2024-01-19',
    description: 'Double beef patty, melted cheese, caramelised onions and house sauce.',
    includedItems: ['Brioche bun', 'Double beef patty', 'Cheese', 'House sauce'],
    customizationGroups: [
      selectionGroup('cook', 'Patty Cooking', true, 1, [
        { id: 'bur-well', name: 'Well Done', priceModifier: 0, isDefault: true },
        { id: 'bur-medium', name: 'Medium', priceModifier: 0 },
      ]),
      selectionGroup('addons', 'Add Ons', false, 3, [
        { id: 'add-egg', name: 'Fried Egg', priceModifier: 5 },
        { id: 'add-bacon', name: 'Bacon', priceModifier: 8 },
        { id: 'add-cheese', name: 'Extra Cheese', priceModifier: 6 },
        { id: 'add-fries', name: 'Upgrade to Combo (Fries + Drink)', priceModifier: 12 },
      ]),
    ],
  },
  {
    id: '12',
    name: 'Chicken Pasta',
    vendor: 'Tasty Bowls',
    vendorId: '5',
    rating: 4.6,
    reviewCount: 47,
    price: 48,
    deliveryTime: '25-40 min',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    location: 'Spintex',
    category: 'continental',
    popularity: 66,
    createdAt: '2024-01-21',
    description: 'Creamy Alfredo pasta with grilled chicken strips and parmesan.',
    includedItems: ['Penne pasta', 'Grilled chicken', 'Cream sauce', 'Parmesan'],
    customizationGroups: [
      selectionGroup('protein', 'Protein', true, 1, [
        { id: 'pas-chicken', name: 'Chicken', priceModifier: 0, isDefault: true },
        { id: 'pas-shrimp', name: 'Shrimp', priceModifier: 15 },
        { id: 'pas-veg', name: 'Veggie Only', priceModifier: -5 },
      ]),
      selectionGroup('topping', 'Toppings', false, 2, [
        { id: 'pas-mushroom', name: 'Mushrooms', priceModifier: 5 },
        { id: 'pas-parmesan', name: 'Extra Parmesan', priceModifier: 4 },
        { id: 'pas-chilli', name: 'Chilli Flakes', priceModifier: 0 },
      ]),
    ],
  },
  {
    id: '13',
    name: 'Fresh Salad Bowl',
    vendor: 'Tasty Bowls',
    vendorId: '5',
    rating: 4.4,
    reviewCount: 38,
    price: 35,
    deliveryTime: '15-25 min',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
    location: 'Spintex',
    category: 'continental',
    popularity: 58,
    createdAt: '2024-01-22',
    description: 'Crisp greens, cherry tomatoes, avocado and grilled chicken with vinaigrette.',
    customizationGroups: [
      selectionGroup('protein', 'Protein', true, 1, [
        { id: 'sal-chicken', name: 'Grilled Chicken', priceModifier: 0, isDefault: true },
        { id: 'sal-tuna', name: 'Tuna', priceModifier: 8 },
        { id: 'sal-beans', name: 'Roasted Chickpeas', priceModifier: 0 },
      ]),
      selectionGroup('dressing', 'Dressing', true, 1, [
        { id: 'dr-vinaigrette', name: 'Vinaigrette', priceModifier: 0, isDefault: true },
        { id: 'dr-ranch', name: 'Ranch', priceModifier: 4 },
        { id: 'dr-goat', name: 'Honey Mustard', priceModifier: 3 },
      ]),
    ],
  },
  {
    id: '14',
    name: 'Suya Skewers',
    vendor: 'Street Bites',
    vendorId: '4',
    rating: 4.7,
    reviewCount: 73,
    price: 25,
    deliveryTime: '15-25 min',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    location: 'Madina',
    category: 'snacks',
    popularity: 81,
    createdAt: '2024-01-23',
    description: 'Spiced grilled beef skewers dusted with ground pepper and served with sliced onion.',
    includedItems: ['4 beef skewers', 'Sliced onions', 'Pepper dust'],
    customizationGroups: [
      selectionGroup('heat', 'Suya Heat', true, 1, [
        { id: 'su-mild', name: 'Mild', priceModifier: 0, isDefault: true },
        { id: 'su-hot', name: 'Hot', priceModifier: 0 },
        { id: 'su-extra', name: 'Extra Hot', priceModifier: 2 },
      ]),
    ],
  },
  {
    id: '15',
    name: 'Crispy Fries',
    vendor: 'Street Bites',
    vendorId: '4',
    rating: 4.2,
    reviewCount: 44,
    price: 20,
    deliveryTime: '10-20 min',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',
    location: 'Madina',
    category: 'snacks',
    popularity: 55,
    createdAt: '2024-01-24',
    description: 'Golden salted fries served hot with a choice of dip.',
    customizationGroups: [
      selectionGroup('dip', 'Dip', false, 1, [
        { id: 'cp-ketchup', name: 'Ketchup', priceModifier: 0, isDefault: true },
        { id: 'cp-mayo', name: 'Mayo', priceModifier: 2 },
        { id: 'cp-cheese', name: 'Cheese Sauce', priceModifier: 5 },
      ]),
      sizeGroup(),
    ],
  },
  {
    id: '16',
    name: 'Fudgy Chocolate Cake',
    vendor: 'SweetChills',
    vendorId: '6',
    rating: 4.9,
    reviewCount: 67,
    price: 30,
    deliveryTime: '15-25 min',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
    location: 'Adenta',
    category: 'desserts',
    popularity: 77,
    discount: 10,
    createdAt: '2024-01-25',
    description: 'Rich layered chocolate cake with a silky ganache finish.',
    customizationGroups: [
      selectionGroup('addon', 'Add Ons', false, 2, [
        { id: 'ck-icecream', name: 'Vanilla Ice Cream', priceModifier: 8 },
        { id: 'ck-sauce', name: 'Extra Chocolate Sauce', priceModifier: 4 },
        { id: 'ck-nuts', name: 'Roasted Nuts', priceModifier: 5 },
      ]),
    ],
  },
  {
    id: '17',
    name: 'Fresh Fruit Smoothie',
    vendor: 'SweetChills',
    vendorId: '6',
    rating: 4.6,
    reviewCount: 52,
    price: 22,
    deliveryTime: '10-20 min',
    image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=600&q=80',
    location: 'Adenta',
    category: 'drinks',
    popularity: 63,
    createdAt: '2024-01-26',
    description: 'Blended seasonal fruit with a splash of honey and crushed ice.',
    customizationGroups: [
      selectionGroup('fruit', 'Base Fruit', true, 1, [
        { id: 'sm-mango', name: 'Mango', priceModifier: 0, isDefault: true },
        { id: 'sm-pineapple', name: 'Pineapple', priceModifier: 0 },
        { id: 'sm-mixed', name: 'Mixed Berry', priceModifier: 5 },
      ]),
      selectionGroup('boost', 'Boost', false, 1, [
        { id: 'b-ginger', name: 'Ginger Shot', priceModifier: 3 },
        { id: 'b-honey', name: 'Extra Honey', priceModifier: 2 },
      ]),
    ],
  },
  {
    id: '18',
    name: 'Grilled Chicken & Chips',
    vendor: 'Smokey Grill Spot',
    vendorId: '7',
    rating: 4.5,
    reviewCount: 59,
    price: 45,
    deliveryTime: '30-45 min',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80',
    location: 'Airport Residential',
    category: 'continental',
    popularity: 69,
    createdAt: '2024-01-27',
    description: 'Flame-grilled half chicken with chips, coleslaw and the smoky house glaze.',
    includedItems: ['Half grilled chicken', 'Chips', 'Coleslaw', 'House glaze'],
    customizationGroups: [
      proteinGroup(),
      extrasGroup(),
      drinksGroup(),
    ],
  },
]

/* --------------------------- Vendors ----------------------------- */

export const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Royal Kitchen',
    rating: 4.8,
    reviewCount: 124,
    deliveryTime: '25-35 min',
    deliveryFee: 10,
    categories: ['Local Dishes', 'Continental'],
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    logo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=200&q=80',
    location: 'East Legon',
    isOpen: true,
    description:
      'A beloved neighbourhood kitchen serving generous portions of smoky jollof, rich stews and continental favourites.',
    featured: true,
    verified: true,
    createdAt: '2023-11-08',
    promotion: { label: 'Up to 17% off selected meals', discount: 17 },
    popularity: 96,
    opensAt: '10:00 AM',
    closesAt: '10:00 PM',
    services: ['Dine-in', 'Takeaway & Pickup', 'Delivery', 'Party catering', 'Custom group orders'],
    contact: { phone: '+233 24 555 0101', email: 'hello@royalkitchen.gh' },
  },
  {
    id: '2',
    name: "Mama's Kitchen",
    rating: 4.7,
    reviewCount: 98,
    deliveryTime: '20-30 min',
    deliveryFee: 8,
    categories: ['Local Dishes', 'Soups'],
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80',
    location: 'Osu',
    isOpen: true,
    description:
      'Home-style cooking that tastes like it came from your own kitchen. Known for waakye and soul-warming soups.',
    featured: true,
    verified: true,
    createdAt: '2022-04-19',
    promotion: { label: 'Free egg on orders over GH₵60', discount: 0 },
    popularity: 90,
    opensAt: '8:00 AM',
    closesAt: '9:00 PM',
    services: ['Dine-in', 'Takeaway & Pickup', 'Delivery', 'Weekly family meal plans'],
    contact: { phone: '+233 24 555 0102', email: 'hey@mamaskitchen.gh' },
  },
  {
    id: '3',
    name: 'The Food Lab',
    rating: 4.6,
    reviewCount: 72,
    deliveryTime: '30-40 min',
    deliveryFee: 12,
    categories: ['Fast Food', 'Burgers', 'Local Dishes'],
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80',
    location: 'East Legon',
    isOpen: true,
    description:
      'Experimental kitchen blending local flavours with continental craft — pizzas, burgers and weekend specials.',
    featured: true,
    verified: true,
    createdAt: '2024-02-14',
    promotion: { label: '20% off pizzas today', discount: 20 },
    popularity: 87,
    opensAt: '11:00 AM',
    closesAt: '11:00 PM',
    services: ['Dine-in', 'Takeaway & Pickup', 'Delivery', 'Weekend event orders'],
    contact: { phone: '+233 24 555 0103', email: 'lab@thefoodlab.gh' },
  },
  {
    id: '4',
    name: 'Street Bites',
    rating: 4.5,
    reviewCount: 87,
    deliveryTime: '20-35 min',
    deliveryFee: 7,
    categories: ['Fast Food', 'Snacks'],
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80',
    logo: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=200&q=80',
    location: 'Madina',
    isOpen: true,
    description:
      'Street food elevated — wings, suya and fries with serious crunch and big flavour.',
    featured: false,
    verified: false,
    createdAt: '2024-05-02',
    promotion: { label: '15% off chicken wings', discount: 15 },
    popularity: 80,
    opensAt: '11:00 AM',
    closesAt: '10:00 PM',
    services: ['Takeaway & Pickup', 'Delivery', 'Bulk snack packs'],
    contact: { phone: '+233 24 555 0104' },
  },
  {
    id: '5',
    name: 'Tasty Bowls',
    rating: 4.6,
    reviewCount: 47,
    deliveryTime: '25-40 min',
    deliveryFee: 9,
    categories: ['Continental', 'Salads', 'Bowls'],
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
    logo: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=200&q=80',
    location: 'Spintex',
    isOpen: true,
    description:
      'Fresh, balanced bowls and pastas built for the health-conscious foodie.',
    featured: false,
    verified: true,
    createdAt: '2025-03-21',
    promotion: null,
    popularity: 72,
    opensAt: '9:00 AM',
    closesAt: '8:00 PM',
    services: ['Dine-in', 'Takeaway & Pickup', 'Weekly healthy meal plans'],
    contact: { email: 'eat@tastybowls.gh' },
  },
  {
    id: '6',
    name: 'SweetChills',
    rating: 4.9,
    reviewCount: 67,
    deliveryTime: '15-25 min',
    deliveryFee: 6,
    categories: ['Desserts', 'Drinks'],
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80',
    logo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80',
    location: 'Adenta',
    isOpen: true,
    description:
      'Desserts and cold drinks to satisfy every sweet tooth — cakes, smoothies and more.',
    featured: true,
    verified: false,
    createdAt: '2025-07-15',
    promotion: { label: '10% off all cakes', discount: 10 },
    popularity: 75,
    opensAt: '10:00 AM',
    closesAt: '9:00 PM',
    services: ['Takeaway & Pickup', 'Delivery', 'Custom celebration cakes'],
    contact: { phone: '+233 24 555 0106' },
  },
  {
    id: '7',
    name: 'Smokey Grill Spot',
    rating: 4.5,
    reviewCount: 59,
    deliveryTime: '30-45 min',
    deliveryFee: 12,
    categories: ['Continental', 'Grill'],
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    logo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80',
    location: 'Airport Residential',
    isOpen: false,
    description: 'Chargrilled meats and smoky sauces from the grill masters of Airport Residential.',
    featured: false,
    verified: true,
    createdAt: '2023-06-08',
    promotion: null,
    popularity: 64,
    opensAt: '4:00 PM',
    closesAt: '11:00 PM',
  },
]

/* -------------------------- Categories ---------------------------- */

export const categories: Category[] = [
  {
    id: '1',
    name: 'Local Dishes',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    slug: 'local-dishes',
    description: 'Home-style rice, stews and traditional plates made the authentic way.',
  },
  {
    id: '2',
    name: 'Fast Food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    slug: 'fast-food',
    description: 'Burgers, wings, pizza and everything quick and craveable.',
  },
  {
    id: '3',
    name: 'Continental',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
    slug: 'continental',
    description: 'International favourites from pasta and bowls to smokey grills.',
  },
  {
    id: '4',
    name: 'Snacks',
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80',
    slug: 'snacks',
    description: 'Bites between meals — suya, fries and street classics.',
  },
  {
    id: '5',
    name: 'Drinks',
    image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80',
    slug: 'drinks',
    description: 'Fresh juices, smoothies and cold drinks to go with your meal.',
  },
  {
    id: '6',
    name: 'Desserts',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80',
    slug: 'desserts',
    description: 'Cakes, puddings and sweet finishes for every mood.',
  },
]

/* --------------------------- Reviews ------------------------------ */

export const reviews: Review[] = [
  {
    id: '1',
    customerName: 'Kwame Mensah',
    rating: 5,
    comment:
      'Great food and fast delivery. Ordering was very easy and the app is super intuitive.',
    location: 'Accra',
    createdAt: '2024-02-01',
  },
  {
    id: '2',
    customerName: 'Ama Owusu',
    rating: 5,
    comment:
      'LunchUp has made my lunch breaks so much easier. The variety of restaurants is amazing!',
    location: 'Kumasi',
    createdAt: '2024-02-03',
  },
  {
    id: '3',
    customerName: 'Yaw Boateng',
    rating: 5,
    comment:
      'Excellent service! My order arrived hot and exactly as I requested. Highly recommend.',
    location: 'Accra',
    createdAt: '2024-02-05',
  },
  {
    id: '4',
    customerName: 'Abena Asante',
    rating: 5,
    comment:
      'Love the app! Very user-friendly and the customer support is outstanding.',
    location: 'Tema',
    createdAt: '2024-02-08',
  },
]

export const vendorReviews: Record<string, Review[]> = {
  '1': [
    {
      id: 'vr-1',
      customerName: 'Kojo Appiah',
      rating: 5,
      comment: 'The jollof from Royal Kitchen is unmatched. Packed hot and generous portions.',
      location: 'East Legon',
      createdAt: '2024-02-10',
    },
    {
      id: 'vr-2',
      customerName: 'Efua Dadzie',
      rating: 4,
      comment: 'Ordered the beef stew — so flavourful. Delivery was a little slow but worth it.',
      location: 'Accra',
      createdAt: '2024-02-12',
    },
  ],
  '2': [
    {
      id: 'vr-m1',
      customerName: 'Fiifi Amoah',
      rating: 5,
      comment: 'Best waakye in Osu, hands down. The shito is dangerously good.',
      location: 'Osu',
      createdAt: '2024-02-11',
    },
  ],
  '3': [
    {
      id: 'vr-f1',
      customerName: 'Nana Osei',
      rating: 5,
      comment: 'Pizza and banku in one place — The Food Lab never misses.',
      location: 'East Legon',
      createdAt: '2024-02-14',
    },
  ],
  '4': [
    {
      id: 'vr-s1',
      customerName: 'Akosua Boadu',
      rating: 4,
      comment: 'Wings arrived crispy and saucy. The suya is a must-try.',
      location: 'Madina',
      createdAt: '2024-02-09',
    },
  ],
}

export const foodReviews: Record<string, Review[]> = {
  '1': [
    {
      id: 'fr-1',
      customerName: 'Esi Nyarko',
      rating: 5,
      comment: 'Smoky, rich and perfectly spicy. The chicken was tender and juicy.',
      location: 'East Legon',
      createdAt: '2024-02-06',
    },
  ],
  '2': [
    {
      id: 'fr-2',
      customerName: 'Kofi Addo',
      rating: 5,
      comment: 'Comfort food at its best. Add extra egg — you will not regret it.',
      location: 'Osu',
      createdAt: '2024-02-02',
    },
  ],
}

/* ----------------------------- Deals ------------------------------ */

export type { Deal }

export const deals: Deal[] = foods
  .filter((food) => food.discount && food.discount > 0)
  .map((food) => ({
    id: `deal-${food.id}`,
    foodId: food.id,
    discount: food.discount as number,
    originalPrice: food.price,
    vendorId: food.vendorId,
    expiresAt: '2026-12-31T23:59:59Z',
    label: `${food.discount}% off ${food.name}`,
  }))

/* ---------------------------- Coupons ----------------------------- */

export const coupons: Coupon[] = [
  {
    code: 'LUNCH10',
    type: 'percent',
    value: 10,
    minSubtotal: 50,
    maxDiscount: 25,
    label: '10% off orders over GH₵50',
  },
  {
    code: 'FIRST20',
    type: 'percent',
    value: 20,
    minSubtotal: 30,
    maxDiscount: 30,
    label: '20% off your first order',
  },
  {
    code: 'FREEDEL',
    type: 'fixed',
    value: 10,
    minSubtotal: 80,
    label: 'Free delivery on orders over GH₵80',
  },
]

/* ------------------------- Delivery setup ------------------------- */

export const DELIVERY_METHODS = [
  { id: 'standard' as const, label: 'Standard Delivery', fee: 10, eta: '25-40 min', description: 'Reliable delivery by a LunchUp rider' },
  { id: 'express' as const, label: 'Express Delivery', fee: 18, eta: '15-25 min', description: 'Priority dispatch straight to your door' },
]

export const presetAddresses: DeliveryAddress[] = [
  {
    id: 'addr-1',
    name: 'Kofi Mensah',
    phone: '+233 24 000 0000',
    address: '14 Boundary Road, East Legon',
    landmark: 'Beside the Total fuel station',
    city: 'Accra',
    isDefault: true,
  },
  {
    id: 'addr-2',
    name: 'Kofi Mensah',
    phone: '+233 24 000 0000',
    address: '43 Oxford Street',
    landmark: 'Opposite the pharmacy',
    city: 'Accra',
  },
]

/* --------------------------- Overview ----------------------------- */

/**
 * Platform metrics for the "LunchUp by the Numbers" section.
 * Placeholder values — connect to real analytics when the backend exists.
 */
export const platformStats = [
  { icon: 'users', value: '25,000+', label: 'Active Customers' },
  { icon: 'vendors', value: '250+', label: 'Food Vendors' },
  { icon: 'completed', value: '50,000+', label: 'Orders Delivered' },
  { icon: 'rating', value: '4.8/5', label: 'Customer Rating' },
] as const

/**
 * App store download placeholders. In production these should point at the
 * published store listings; the /download page drives this experience.
 */
export const appStoreLinks = {
  ios: '/download',
  googlePlay: '/download',
} as const

/* ---------------------------- Helpers ----------------------------- */

export function getFoodById(id: string): Food | undefined {
  return foods.find((food) => food.id === id)
}

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find((restaurant) => restaurant.id === id)
}

export function getFoodsByVendor(vendorId: string): Food[] {
  return foods.filter((food) => food.vendorId === vendorId)
}

export function getFeaturedFoods(limit = 4): Food[] {
  return foods.filter((food) => food.featured).slice(0, limit)
}

export function getPopularFoods(limit = 4): Food[] {
  return [...foods]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit)
}

export function getTopRatedFoods(limit = 4): Food[] {
  return [...foods].sort((a, b) => b.rating - a.rating).slice(0, limit)
}

export function getDealFoods(): Food[] {
  return foods.filter((food) => food.discount && food.discount > 0)
}

export function getDiscountedPrice(food: Food): number {
  const discount = food.discount || 0
  return Math.round(food.price * (1 - discount / 100))
}

export function getFeaturedRestaurants(limit = 3): Restaurant[] {
  return restaurants.filter((restaurant) => restaurant.featured).slice(0, limit)
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug)
}

export function getCategoryTerm(slug: string): string | undefined {
  const map: Record<string, string> = {
    'local-dishes': 'local',
    'fast-food': 'fastfood',
    continental: 'continental',
    snacks: 'snacks',
    drinks: 'drinks',
    desserts: 'desserts',
  }
  return map[slug]
}

export function getRestaurantReviews(vendorId: string): Review[] {
  return vendorReviews[vendorId] ?? []
}

export function getFoodReviews(foodId: string): Review[] {
  return foodReviews[foodId] ?? []
}