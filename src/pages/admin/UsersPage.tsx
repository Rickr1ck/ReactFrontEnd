import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import UserForm, { USER_FORM_ID } from './UserForm'
import api from '@/lib/api'
import type { UserResponse } from '@/types/user.types'

const PAGE_SIZE = 20

export default function UsersPage() {
  const { role } = useAuthStore()
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/users', {
        params: { page, pageSize: PAGE_SIZE },
      })
      setUsers(response.data.items)
      setTotal(response.data.totalCount)
    } catch {
      setError('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openCreate = () => {
    setEditTarget(null)
    setSubmitError(null)
    setModalOpen(true)
  }

  const openEdit = (user: UserResponse) => {
    setEditTarget(user)
    setSubmitError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setSubmitError(null)
  }

  const handleSubmit = async (values: { firstName: string; lastName: string; email: string; password: string; role: string }) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (editTarget) {
        // Update user
        const updateData: any = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          role: values.role,
        }
        if (values.password) {
          updateData.password = values.password
        }
        await api.put(`/users/${editTarget.id}`, updateData)
      } else {
        // Create user
        await api.post('/users', {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
          role: values.role,
        })
      }
      closeModal()
      fetchUsers()
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Failed to save user. Please check your input and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return
    }

    try {
      await api.delete(`/users/${userId}`)
      fetchUsers()
    } catch {
      alert('Failed to delete user. Please try again.')
    }
  }

  const canManage = role === 'TenantAdmin' || role === 'SuperAdmin'

  const formatRole = (rbacRole: string) => {
    const roleMap: Record<string, string> = {
      SuperAdmin: 'Super Admin',
      TenantAdmin: 'Tenant Admin',
      SalesManager: 'Sales Manager',
      SalesRep: 'Sales Representative',
      SupportAgent: 'Support Agent',
      MarketingManager: 'Marketing Manager',
      ReadOnly: 'Read Only',
    }
    return roleMap[rbacRole] || rbacRole
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Loading…' : `${total} users in your organization`}
            </p>
          </div>
          {canManage && (
            <button
              onClick={openCreate}
              className="
                inline-flex items-center gap-2 px-4 h-9 rounded-lg
                bg-brand-600 text-white text-sm font-medium
                hover:bg-brand-800 active:scale-[0.98] transition-all
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add user
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-24 gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-gray-400">Loading users…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-sm text-gray-600">{error}</p>
              <button
                onClick={fetchUsers}
                className="text-sm text-brand-600 font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-20 text-center">
                        <p className="text-sm text-gray-500">No users yet.</p>
                        {canManage && (
                          <button
                            onClick={openCreate}
                            className="text-sm text-brand-600 font-medium hover:underline mt-2"
                          >
                            Add your first user
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-brand-600 font-medium text-xs">
                                {`${user.firstName[0]}${user.lastName[0]}`.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {formatRole(user.rbacRole)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManage && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(user)}
                                className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                                title="Edit user"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete user"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > PAGE_SIZE && !loading && !error && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of{' '}
                {total} users
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-500 px-2">{page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * PAGE_SIZE >= total}
                  className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit user' : 'Add user'}
        size="lg"
        footer={
          <>
            {submitError && (
              <p className="text-xs text-red-600 mr-auto">{submitError}</p>
            )}
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="px-4 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={USER_FORM_ID}
              disabled={submitting}
              className="px-4 h-9 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {editTarget ? 'Save changes' : 'Create user'}
            </button>
          </>
        }
      >
        <UserForm
          user={editTarget ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={submitting}
        />
      </Modal>
    </>
  )
}
