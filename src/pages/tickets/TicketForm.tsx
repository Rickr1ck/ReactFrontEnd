import { useState, useEffect, type FormEvent } from 'react'
import type { TicketResponse, CreateTicketRequest, TicketPriority } from '@/types/ticket.types'
import { userService } from '@/services/userService'
import { customerService } from '@/services/customerService'
import { contactService } from '@/services/contactService'
import type { UserResponse } from '@/services/userService'
import type { CustomerResponse } from '@/types/customer.types'
import type { ContactResponse } from '@/services/contactService'

interface TicketFormProps {
  ticket?:    TicketResponse
  onSubmit:  (values: CreateTicketRequest) => Promise<void>
  onCancel:  () => void
  submitting?: boolean
}

interface TicketFormValues {
  customerId:  string
  contactId:   string
  subject:     string
  description: string
  priority:    TicketPriority
  assignedToId:string
  dueAt:       string
  tags:        string
}

const emptyForm: TicketFormValues = {
  customerId:  '',
  contactId:   '',
  subject:     '',
  description: '',
  priority:    'Medium',
  assignedToId:'',
  dueAt:       '',
  tags:        '',
}

function fromTicket(t: TicketResponse): TicketFormValues {
  return {
    customerId:  t.customerId,
    contactId:   t.contactId ?? '',
    subject:     t.subject,
    description: t.description ?? '',
    priority:    t.priority,
    assignedToId:t.assignedToId ?? '',
    dueAt:       t.dueAt ?? '',
    tags:        t.tags?.join(', ') ?? '',
  }
}

const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical']

interface FieldProps {
  id:           string
  label:        string
  value:        string
  onChange:     (v: string) => void
  error?:       string
  type?:        string
  placeholder?: string
  hint?:        string
  required?:    boolean
}

function Field({ id, label, value, onChange, error, type = 'text', placeholder, hint, required }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full h-9 px-3 rounded-lg border text-sm text-gray-900
          placeholder:text-gray-400 transition-shadow
          focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
        `}
      />
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function Textarea({ id, label, value, onChange, error, placeholder, hint, rows = 3 }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; hint?: string; rows?: number }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <textarea
        id={id} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className={`
          w-full px-3 py-2 rounded-lg border text-sm text-gray-900
          placeholder:text-gray-400 transition-shadow resize-none
          focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
        `}
      />
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

type Errors = Partial<Record<keyof TicketFormValues, string>>

function validate(v: TicketFormValues): Errors {
  const errors: Errors = {}
  if (!v.customerId.trim()) errors.customerId = 'Customer ID is required.'
  if (!v.subject.trim()) errors.subject = 'Subject is required.'
  if (v.dueAt && !/^\d{4}-\d{2}-\d{2}$/.test(v.dueAt))
    errors.dueAt = 'Use YYYY-MM-DD format.'
  return errors
}

export default function TicketForm({ ticket, onSubmit }: TicketFormProps) {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [contacts, setContacts] = useState<ContactResponse[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [values, setValues] = useState<TicketFormValues>(
    ticket ? fromTicket(ticket) : emptyForm
  )
  const [errors, setErrors] = useState<Errors>({})

  // Fetch users for support agent dropdown
  useEffect(() => {
    let cancelled = false
    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        const response = await userService.getAll(1, 100)
        if (!cancelled) {
          setUsers(response.items)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        if (!cancelled) setLoadingUsers(false)
      }
    }
    fetchUsers()
    return () => { cancelled = true }
  }, [])

  // Fetch customers for customer dropdown
  useEffect(() => {
    let cancelled = false
    const fetchCustomers = async () => {
      setLoadingCustomers(true)
      try {
        const response = await customerService.getAll(1, 100)
        if (!cancelled) {
          setCustomers(response.items)
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error)
      } finally {
        if (!cancelled) setLoadingCustomers(false)
      }
    }
    fetchCustomers()
    return () => { cancelled = true }
  }, [])

  // Fetch contacts when customer is selected
  useEffect(() => {
    if (!values.customerId) {
      setContacts([])
      setValues(v => ({ ...v, contactId: '' }))
      return
    }

    let cancelled = false
    const fetchContacts = async () => {
      setLoadingContacts(true)
      try {
        const response = await contactService.getByCustomer(values.customerId, 1, 50)
        if (!cancelled) {
          setContacts(response.items)
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error)
      } finally {
        if (!cancelled) setLoadingContacts(false)
      }
    }
    fetchContacts()
    return () => { cancelled = true }
  }, [values.customerId])

  useEffect(() => {
    setValues(ticket ? fromTicket(ticket) : emptyForm)
    setErrors({})
  }, [ticket])

  const set = (field: keyof TicketFormValues) => (value: string) => {
    setValues(v => ({ ...v, [field]: value }))
    if (errors[field]) {
      setErrors(e => { const n = { ...e }; delete n[field]; return n })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    await onSubmit({
      customerId:   values.customerId.trim(),
      contactId:    values.contactId.trim() || null,
      subject:      values.subject.trim(),
      description: values.description.trim() || null,
      priority:    values.priority,
      assignedToId:values.assignedToId.trim() || null,
      dueAt:       values.dueAt || null,
      tags:        values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
    })
  }

  return (
    <form id="ticket-form" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ticket details</p>
          <Field
            id="subject" label="Subject" value={values.subject}
            onChange={set('subject')} error={errors.subject}
            placeholder="Cannot login to the dashboard" required
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="customerId" className="block text-xs font-medium text-gray-600 mb-1.5">
                Customer<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                id="customerId"
                value={values.customerId}
                onChange={e => set('customerId')(e.target.value)}
                disabled={loadingCustomers}
                className={`
                  w-full h-9 px-3 rounded-lg border text-sm text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                  border-gray-200 bg-white
                  ${errors.customerId ? 'border-red-300 bg-red-50' : ''}
                  ${loadingCustomers ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <option value="">Select a customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName}
                  </option>
                ))}
              </select>
              {loadingCustomers && <p className="text-xs text-gray-400 mt-1">Loading customers...</p>}
              {!loadingCustomers && customers.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No customers available</p>
              )}
              {errors.customerId && <p className="text-xs text-red-600 mt-1">{errors.customerId}</p>}
            </div>
            <div>
              <label htmlFor="priority" className="block text-xs font-medium text-gray-600 mb-1.5">
                Priority<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                id="priority" value={values.priority}
                onChange={e => set('priority')(e.target.value as TicketPriority)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <Textarea
            id="description" label="Description" value={values.description}
            onChange={set('description')} placeholder="Describe the issue in detail…"
            rows={4}
          />
        </div>

        <hr className="border-gray-100" />

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assignment & dates</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignedToId" className="block text-xs font-medium text-gray-600 mb-1.5">
                Assigned to
              </label>
              <select
                id="assignedToId"
                value={values.assignedToId}
                onChange={e => set('assignedToId')(e.target.value)}
                disabled={loadingUsers}
                className={`
                  w-full h-9 px-3 rounded-lg border text-sm text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                  border-gray-200 bg-white
                  ${loadingUsers ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <option value="">Select a support agent...</option>
                {users
                  .filter(u => u.role === 'SupportAgent' || u.role === 'TenantAdmin' || u.role === 'SuperAdmin')
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </option>
                  ))}
              </select>
              {loadingUsers && <p className="text-xs text-gray-400 mt-1">Loading users...</p>}
              {!loadingUsers && users.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No users available</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Support agent responsible</p>
            </div>
            <div>
              <label htmlFor="contactId" className="block text-xs font-medium text-gray-600 mb-1.5">
                Contact (optional)
              </label>
              <select
                id="contactId"
                value={values.contactId}
                onChange={e => set('contactId')(e.target.value)}
                disabled={loadingContacts || !values.customerId}
                className={`
                  w-full h-9 px-3 rounded-lg border text-sm text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                  border-gray-200 bg-white
                  ${(loadingContacts || !values.customerId) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <option value="">Select a contact (optional)...</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} {contact.email ? `- ${contact.email}` : ''}
                  </option>
                ))}
              </select>
              {!values.customerId && (
                <p className="text-xs text-gray-400 mt-1">Select a customer first</p>
              )}
              {loadingContacts && <p className="text-xs text-gray-400 mt-1">Loading contacts...</p>}
              {values.customerId && !loadingContacts && contacts.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No contacts for this customer</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Reporting contact</p>
            </div>
          </div>
          <div className="mt-4">
            <Field
              id="dueAt" label="Due date" value={values.dueAt}
              onChange={set('dueAt')} error={errors.dueAt}
              placeholder="YYYY-MM-DD" hint="e.g. 2025-06-30"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <Field
            id="tags" label="Tags" value={values.tags}
            onChange={set('tags')}
            placeholder="bug, urgent, billing"
            hint="Comma-separated tags"
          />
        </div>
      </div>
    </form>
  )
}

export const TICKET_FORM_ID = 'ticket-form'
