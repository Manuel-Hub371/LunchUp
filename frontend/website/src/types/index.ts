/* ------------------------------------------------------------------ *
 * LunchUp domain models
 *
 * These types describe the customer-facing marketplace data. The UI
 * consumes them through the service layer (src/lib/services). Shapes
 * mirror what the LunchUp API will return so that a real backend can
 * replace the development data source without rewriting components.
 * ------------------------------------------------------------------ */

/* ----------------------------- Food ------------------------------ */

export interface FoodCustomizationOption {
  id: string
  name: string
  priceModifier: number
  available: boolean
  isDefault?: boolean
}

export interface FoodCustomizationGroup {
  id: string
  name: string
  required: boolean
  /** For required groups: number of selections the customer must make. */
  minSelections: number
  /** Maximum number of selections allowed in this group. */
  maxSelections: number
  options: FoodCustomizationOption[]
}

export interface Food {
  id: string
  name: string
  vendor: string
  vendorId: string
  rating: number
  reviewCount: number
  price: number
  deliveryTime: string
  image: string
  /** Additional gallery views when the vendor provides multiple photos. */
  images?: string[]
  description?: string
  category?: string
  discount?: number
  location?: string
  createdAt?: string
  popularity?: number
  featured?: boolean
  available?: boolean
  includedItems?: string[]
  customizationGroups?: FoodCustomizationGroup[]
}

/* --------------------------- Vendor ------------------------------ */

export interface RestaurantPromotion {
  label: string
  discount: number
}

export interface Restaurant {
  id: string
  name: string
  rating: number
  reviewCount: number
  deliveryTime: string
  deliveryFee?: number
  categories: string[]
  image: string
  logo?: string
  location?: string
  isOpen?: boolean
  description?: string
  featured?: boolean
  promotion?: RestaurantPromotion | null
  popularity?: number
  /** Marketplace verification (identity + hygiene checks completed). */
  verified?: boolean
  /** When the restaurant joined the marketplace. */
  createdAt?: string
  /** Opening time, e.g. "10:00 AM". */
  opensAt?: string
  /** Closing time, e.g. "10:00 PM". */
  closesAt?: string
  /** Services offered by the restaurant (dine-in, takeaway, catering…). */
  services?: string[]
  /** Public contact details, shown on the About tab when available. */
  contact?: {
    phone?: string
    email?: string
  }
}

/* -------------------------- Catalog ----------------------------- */

export interface Category {
  id: string
  name: string
  image: string
  slug: string
  description?: string
}

export interface Deal {
  id: string
  foodId: string
  discount: number
  originalPrice?: number
  expiresAt: string
  vendorId?: string
  label?: string
}

/* -------------------------- Reviews ----------------------------- */

export interface Review {
  id: string
  customerName: string
  rating: number
  comment: string
  avatar?: string
  location?: string
  createdAt?: string
}

/* ---------------------------- Cart ------------------------------ */

export interface CartSelection {
  groupId: string
  optionIds: string[]
}

/**
 * A single line in the cart. `key` is a stable identity derived from the
 * configuration (food + selected options), so two orders of the same food
 * with different customizations remain distinct lines.
 */
export interface CartLine {
  key: string
  food: Food
  quantity: number
  selections: CartSelection[]
  specialInstructions?: string
  /** Client-side price preview only. The authoritative amount is recomputed
   * by the order service at checkout. */
  unitPrice: number
}

export interface CartTotals {
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
}

/* -------------------------- Delivery ------------------------------ */

export interface DeliveryAddress {
  id?: string
  name: string
  phone: string
  address: string
  landmark?: string
  city: string
  instructions?: string
  isDefault?: boolean
}

export type DeliveryMethod = 'standard' | 'express'

/* ------------------------- Payments ------------------------------ */

export type PaymentMethod = 'mobile_money' | 'card' | 'pay_on_delivery'

export type PaymentStatus =
  | 'pending'
  | 'verified'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'expired'

export interface Payment {
  id: string
  orderId: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  reference: string
  createdAt: string
  updatedAt?: string
}

/* ---------------------------- Orders ------------------------------ */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface OrderSelectionSummary {
  groupName: string
  optionNames: string[]
  priceModifier: number
}

export interface OrderItem {
  foodId: string
  foodName: string
  vendorId: string
  vendorName: string
  image: string
  quantity: number
  /** Server-authoritative unit price (food base + modifiers). */
  unitPrice: number
  lineTotal: number
  selections: OrderSelectionSummary[]
  specialInstructions?: string
}

export interface OrderTimelineEntry {
  status: OrderStatus
  label: string
  timestamp: string
}

export interface Order {
  id: string
  number: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  deliveryMethod: DeliveryMethod
  paymentMethod: PaymentMethod
  deliveryAddress: DeliveryAddress
  estimatedDeliveryTime: string
  createdAt: string
  paymentId?: string
  paymentReference?: string
  timeline: OrderTimelineEntry[]
}

/* --------------------------- Coupons ------------------------------ */

export interface Coupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minSubtotal?: number
  maxDiscount?: number
  label: string
}

/* ---------------------------- Search ----------------------------- */

export interface SearchResults {
  foods: Food[]
  restaurants: Restaurant[]
  categories: Category[]
}

/* ------------------------- Enumerations --------------------------- */

export const DELIVERY_LOCATIONS = [
  'East Legon',
  'Osu',
  'Madina',
  'Spintex',
  'Adenta',
  'Airport Residential',
  'Labadi',
] as const

export type DeliveryLocation = (typeof DELIVERY_LOCATIONS)[number]

export const FOOD_SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'fastest', label: 'Fastest Delivery' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'cheapest', label: 'Lowest Price' },
  { value: 'expensive', label: 'Highest Price' },
  { value: 'deals', label: 'Best Deals' },
  { value: 'nearest', label: 'Nearest' },
] as const

export const RESTAURANT_SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'fastest', label: 'Fastest Delivery' },
  { value: 'cheapest', label: 'Lowest Delivery Fee' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
] as const

export type FoodSort = (typeof FOOD_SORT_OPTIONS)[number]['value']
export type RestaurantSort = (typeof RESTAURANT_SORT_OPTIONS)[number]['value']