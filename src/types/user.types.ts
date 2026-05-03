export type RbacRole = 
  | 'SuperAdmin'
  | 'TenantAdmin'
  | 'SalesManager'
  | 'SalesRep'
  | 'SupportAgent'
  | 'MarketingManager'
  | 'ReadOnly'

export interface UserResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  rbacRole: RbacRole
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  rbacRole: RbacRole
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  rbacRole?: RbacRole
  isActive?: boolean
}
