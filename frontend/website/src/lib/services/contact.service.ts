/**
 * Contact service — submits a customer support enquiry through the same
 * boundary a real support API would use.
 */
import { ApiError, withLatency } from './api'

export interface ContactEnquiry {
  name: string
  email: string
  subject: string
  message: string
}

export const contactService = {
  async submit(enquiry: ContactEnquiry): Promise<{ reference: string }> {
    if (!enquiry.name.trim() || !enquiry.email.trim() || !enquiry.subject.trim() || !enquiry.message.trim()) {
      throw new ApiError('Please complete all fields before submitting.', 422)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email.trim())) {
      throw new ApiError('Please enter a valid email address.', 422)
    }
    await withLatency(null)
    return { reference: `SUP-${Date.now().toString(36).toUpperCase()}` }
  },
}