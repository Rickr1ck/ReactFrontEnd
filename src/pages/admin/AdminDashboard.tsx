import { useState } from 'react'
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

// Mock data - will be replaced with actual API calls
const mockTenants = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'ClientSphere System',
    slug: 'clientsphere-system',
    status: 'Active',
    tier: 'Enterprise',
    users: 1,
    maxUsers: 32767,
    monthlyRevenue: 0,
    createdAt: '2024-01-01',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Demo Company Inc.',
    slug: 'demo-company',
    status: 'Active',
    tier: 'Professional',
    users: 1,
    maxUsers: 50,
    monthlyRevenue: 2999,
    createdAt: '2024-01-15',
  },
]

const tierPrices: Record<string, number> = {
  Free: 0,
  Starter: 999,
  Professional: 2999,
  Enterprise: 9999,
}

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString()}`
}

export default function AdminDashboard() {
  const { role } = useAuthStore()
  const [loading] = useState(false)

  // Only SuperAdmin can access this
  if (role !== 'SuperAdmin') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500">Only Super Administrators can access this page.</p>
        </div>
      </div>
    )
  }

  const totalTenants = mockTenants.length
  const activeTenants = mockTenants.filter(t => t.status === 'Active').length
  const totalUsers = mockTenants.reduce((sum, t) => sum + t.users, 0)
  const totalMonthlyRevenue = mockTenants.reduce((sum, t) => sum + t.monthlyRevenue, 0)
  const totalAnnualRevenue = totalMonthlyRevenue * 12

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Monitor tenant activity, users, and revenue across the platform
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-blue-50">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalTenants}</p>
          <p className="text-sm text-gray-500 mt-1">Total Tenants</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{activeTenants} active</span>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-purple-50">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
          <p className="text-sm text-gray-500 mt-1">Total Users</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
            <span>Across all tenants</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-green-50">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMonthlyRevenue)}</p>
          <p className="text-sm text-gray-500 mt-1">Monthly Revenue</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>From subscriptions</span>
          </div>
        </div>

        {/* Annual Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-amber-50">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAnnualRevenue)}</p>
          <p className="text-sm text-gray-500 mt-1">Annual Revenue</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
            <span>Projected (MRR × 12)</span>
          </div>
        </div>
      </div>

      {/* Tenant Monitoring Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Tenant Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Monitor all tenants, their plans, and revenue
              </p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Activity className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tenant
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Plan
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Users
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Monthly Revenue
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Since
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockTenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                      <p className="text-xs text-gray-400">{tenant.slug}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        tenant.status === 'Active'
                          ? 'bg-green-50 text-green-800'
                          : tenant.status === 'Trialing'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {tenant.status === 'Active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {tenant.status === 'Disabled' && <XCircle className="w-3.5 h-3.5" />}
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-700">{tenant.tier}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{tenant.users}</span>
                      <span className="text-gray-400"> / {tenant.maxUsers.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(tenant.monthlyRevenue)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-gray-400">
                      {new Date(tenant.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Plan</h2>
          <div className="space-y-3">
            {Object.entries(tierPrices).map(([tier, price]) => {
              const tenantsOnTier = mockTenants.filter(t => t.tier === tier).length
              const revenue = tenantsOnTier * price
              return (
                <div key={tier} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tier}</p>
                    <p className="text-xs text-gray-400">{tenantsOnTier} tenant{tenantsOnTier !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(revenue)}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(price)}/month</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Platform Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">System Status</p>
                  <p className="text-xs text-gray-500">All services operational</p>
                </div>
              </div>
              <span className="text-xs font-medium text-green-700">Healthy</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">API Uptime</p>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </div>
              </div>
              <span className="text-xs font-medium text-blue-700">99.9%</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Active Sessions</p>
                  <p className="text-xs text-gray-500">Current users online</p>
                </div>
              </div>
              <span className="text-xs font-medium text-purple-700">{totalUsers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
