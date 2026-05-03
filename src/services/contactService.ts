import api from '@/lib/api'
import type { PagedResult } from '@/types/api.types'

export interface ContactResponse {
  id: string
  tenantId: string
  customerId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  jobTitle: string | null
  isPrimary: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

const BASE = '/contacts'

export const contactService = {
  async getByCustomer(customerId: string, page = 1, pageSize = 50): Promise<PagedResult<ContactResponse>> {
    const { data } = await api.get<PagedResult<ContactResponse>>(`${BASE}/by-customer/${customerId}`, {
      params: { page, pageSize },
    })
    return data
  },

  async getById(id: string): Promise<ContactResponse> {
    const { data } = await api.get<ContactResponse>(`${BASE}/${id}`)
    return data
  },
}
