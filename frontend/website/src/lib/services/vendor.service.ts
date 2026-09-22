/**
 * Public vendor onboarding service (registration only).
 *
 * Development fallback stores applications in localStorage. In production
 * this lands in the vendor onboarding queue of the LunchUp backend. Vendor
 * administration is out of scope — this surface only captures applications.
 */
import { ApiError, withLatency } from './api'
import { uid } from '@/lib/utils'

const APPLICATIONS_KEY = 'lunchup.vendor.apps.v1'

export interface VendorApplication {
  id: string
  businessName: string
  contactName?: string
  email: string
  phone: string
  businessType: string
  location?: string
  createdAt: string
}

export const vendorService = {
  async submitApplication(input: {
    businessName: string
    contactName?: string
    email: string
    phone: string
    businessType: string
    location?: string
  }): Promise<VendorApplication> {
    await withLatency(null)
    if (!input.businessName.trim()) throw new ApiError('Please enter your business name.', 422)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      throw new ApiError('Please enter a valid business email.', 422)
    }
    if (input.phone.trim().length < 6) throw new ApiError('Please enter a valid phone number.', 422)
    if (!input.businessType) throw new ApiError('Please select a business type.', 422)

    const application: VendorApplication = {
      id: uid('vendor'),
      businessName: input.businessName.trim(),
      contactName: input.contactName?.trim() || undefined,
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      businessType: input.businessType,
      location: input.location?.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    try {
      const existing: VendorApplication[] = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]')
      existing.push(application)
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(existing))
    } catch {
      /* storage unavailable */
    }
    return application
  },
}