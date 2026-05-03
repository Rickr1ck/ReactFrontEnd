import api from '@/lib/api'
import type { PagedResult } from '@/types/api.types'

export interface UserResponse {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const BASE = '/users'

export const userService = {
  async getAll(page = 1, pageSize = 20): Promise<PagedResult<UserResponse>> {
    const { data } = await api.get<PagedResult<UserResponse>>(BASE, {
      params: { page, pageSize },
    })
    return data
  },

  async getById(id: string): Promise<UserResponse> {
    const { data } = await api.get<UserResponse>(`${BASE}/${id}`)
    return data
  },
}
