import type { RbacRole } from '@/types/user.types'

export const ACCESS_MAP: Record<RbacRole, string[]> = {
  SuperAdmin: ['dashboard', 'admin', 'tenants'],
  TenantAdmin: ['dashboard', 'users', 'customers', 'pipeline', 'tickets', 'marketing', 'billing', 'leads'],
  SalesManager: ['dashboard', 'customers', 'leads', 'pipeline', 'billing'],
  SalesRep: ['dashboard', 'customers', 'leads', 'pipeline', 'billing'],
  SupportAgent: ['dashboard', 'tickets'],
  MarketingManager: ['dashboard', 'marketing'],
  ReadOnly: ['dashboard'],
}

export function canAccess(role: RbacRole | null, module: string): boolean {
  if (!role) return false
  return ACCESS_MAP[role]?.includes(module) ?? false
}
