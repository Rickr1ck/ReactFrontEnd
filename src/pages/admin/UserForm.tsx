import { useState, useEffect } from 'react'

export const USER_FORM_ID = 'user-form'

export interface UserFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
}

interface UserFormProps {
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    rbacRole: string
  }
  onSubmit: (values: UserFormData) => void
  onCancel: () => void
  submitting: boolean
}

const ALLOWED_ROLES = [
  { value: 'SalesManager', label: 'Sales Manager' },
  { value: 'SalesRep', label: 'Sales Representative' },
  { value: 'SupportAgent', label: 'Support Agent' },
  { value: 'MarketingManager', label: 'Marketing Manager' },
]

export default function UserForm({ user, onSubmit, onCancel: _onCancel, submitting: _submitting }: UserFormProps) {
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(user?.rbacRole ?? 'SalesRep')

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
      setRole(user.rbacRole)
      setPassword('') // Don't populate password for editing
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      role,
    })
  }

  return (
    <form id={USER_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
      {/* First Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          maxLength={100}
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          className="
            w-full h-10 px-3 rounded-lg border border-gray-300
            text-sm text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          "
          placeholder="John"
        />
      </div>

      {/* Last Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Last Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          maxLength={100}
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          className="
            w-full h-10 px-3 rounded-lg border border-gray-300
            text-sm text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          "
          placeholder="Doe"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          maxLength={255}
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="
            w-full h-10 px-3 rounded-lg border border-gray-300
            text-sm text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          "
          placeholder="john.doe@company.com"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password {!user && <span className="text-red-500">*</span>}
          {user && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
        </label>
        <input
          type="password"
          required={!user}
          minLength={8}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="
            w-full h-10 px-3 rounded-lg border border-gray-300
            text-sm text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          "
          placeholder={user ? '••••••••' : 'Minimum 8 characters'}
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="
            w-full h-10 px-3 rounded-lg border border-gray-300
            text-sm text-gray-900
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          "
        >
          {ALLOWED_ROLES.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  )
}
