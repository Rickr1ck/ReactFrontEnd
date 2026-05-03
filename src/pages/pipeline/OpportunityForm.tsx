import { useState, useEffect, type FormEvent } from 'react'
import type { OpportunityResponse, CreateOpportunityRequest, OpportunityStage } from '@/types/opportunity.types'
import { useAuthStore } from '@/store/authStore'
import { customerService } from '@/services/customerService'
import { leadService } from '@/services/leadService'
import { contactService } from '@/services/contactService'
import type { CustomerResponse } from '@/types/customer.types'
import type { LeadResponse } from '@/types/lead.types'
import type { ContactResponse } from '@/services/contactService'

interface OpportunityFormProps {
  opportunity?:  OpportunityResponse
  onSubmit:      (values: CreateOpportunityRequest) => Promise<void>
  onCancel:      () => void
  submitting?:   boolean
}

interface OpportunityFormValues {
  customerId:       string
  leadId:            string
  title:             string
  stage:             OpportunityStage
  estimatedValue:    string
  probability:       string
  expectedCloseDate: string
  assignedToId:      string
  primaryContactId:  string
  notes:             string
}

const emptyForm: OpportunityFormValues = {
  customerId:       '',
  leadId:            '',
  title:             '',
  stage:            'Prospecting',
  estimatedValue:    '',
  probability:       '',
  expectedCloseDate: '',
  assignedToId:      '',
  primaryContactId:  '',
  notes:             '',
}

function fromOpportunity(o: OpportunityResponse): OpportunityFormValues {
  return {
    customerId:       o.customerId,
    leadId:            o.leadId ?? '',
    title:             o.title,
    stage:             o.stage,
    estimatedValue:    o.estimatedValue?.toString() ?? '',
    probability:       o.probability?.toString() ?? '',
    expectedCloseDate: o.expectedCloseDate ?? '',
    assignedToId:      o.assignedToId ?? '',
    primaryContactId:  o.primaryContactId ?? '',
    notes:             o.notes ?? '',
  }
}

const STAGES: OpportunityStage[] = [
  'Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'ClosedWon', 'ClosedLost',
]

interface FieldProps {
  id:          string
  label:       string
  value:       string
  onChange:    (v: string) => void
  error?:      string
  type?:       string
  placeholder?: string
  hint?:       string
  required?:   boolean
  maxLength?:  number
}

function Field({ id, label, value, onChange, error, type = 'text', placeholder, hint, required, maxLength }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
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

type Errors = Partial<Record<keyof OpportunityFormValues, string>>

function validate(v: OpportunityFormValues): Errors {
  const errors: Errors = {}
  if (!v.customerId.trim()) errors.customerId = 'Customer is required.'
  if (!v.title.trim()) errors.title = 'Title is required.'
  if (v.estimatedValue && isNaN(Number(v.estimatedValue)))
    errors.estimatedValue = 'Must be a number.'
  if (v.probability && (isNaN(Number(v.probability)) || Number(v.probability) < 0 || Number(v.probability) > 100))
    errors.probability = 'Must be 0–100.'
  
  // Validate date format and ensure it's not in the past
  if (v.expectedCloseDate && v.expectedCloseDate.trim()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.expectedCloseDate.trim())) {
      errors.expectedCloseDate = 'Use YYYY-MM-DD format.'
    } else {
      // Check if date is in the past
      const selectedDate = new Date(v.expectedCloseDate.trim() + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        errors.expectedCloseDate = 'Date must be today or in the future.'
      }
    }
  }
  
  return errors
}

export default function OpportunityForm({ opportunity, onSubmit }: OpportunityFormProps) {
  const { userId, role } = useAuthStore()
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [leads, setLeads] = useState<LeadResponse[]>([])
  const [contacts, setContacts] = useState<ContactResponse[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  
  const [values, setValues] = useState<OpportunityFormValues>(() => {
    const initial = opportunity ? fromOpportunity(opportunity) : emptyForm
    // Auto-assign to current user if they are SalesRep or SalesManager
    if (!opportunity && (role === 'SalesRep' || role === 'SalesManager') && userId) {
      initial.assignedToId = userId
    }
    return initial
  })
  const [errors, setErrors] = useState<Errors>({})

  // Fetch customers for dropdown
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

  // Fetch leads for dropdown
  useEffect(() => {
    let cancelled = false
    const fetchLeads = async () => {
      setLoadingLeads(true)
      try {
        const response = await leadService.getAll(1, 100)
        if (!cancelled) {
          setLeads(response.items)
        }
      } catch (error) {
        console.error('Failed to fetch leads:', error)
      } finally {
        if (!cancelled) setLoadingLeads(false)
      }
    }
    fetchLeads()
    return () => { cancelled = true }
  }, [])

  // Fetch contacts when customer is selected
  useEffect(() => {
    if (!values.customerId) {
      setContacts([])
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
    if (opportunity) {
      setValues(fromOpportunity(opportunity))
    } else {
      // Reset to empty form but preserve auto-assignment for SalesRep/SalesManager
      const resetValues = { ...emptyForm }
      if ((role === 'SalesRep' || role === 'SalesManager') && userId) {
        resetValues.assignedToId = userId
      }
      setValues(resetValues)
    }
    setErrors({})
  }, [opportunity, role, userId])

  const set = (field: keyof OpportunityFormValues) => (value: string) => {
    setValues(v => ({ ...v, [field]: value }))
    if (errors[field]) {
      setErrors(e => { const n = { ...e }; delete n[field]; return n })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    
    // Ensure empty strings are converted to null for optional fields
    await onSubmit({
      customerId:        values.customerId.trim(),
      leadId:            values.leadId.trim() || null,
      title:             values.title.trim(),
      stage:             values.stage,
      estimatedValue:    values.estimatedValue ? Number(values.estimatedValue) : null,
      probability:       values.probability ? Number(values.probability) : null,
      expectedCloseDate: values.expectedCloseDate.trim() || null,
      assignedToId:      values.assignedToId.trim() || null,
      primaryContactId:  values.primaryContactId.trim() || null,
      notes:             values.notes.trim() || null,
    })
  }

  return (
    <form id="opportunity-form" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Deal details</p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="title" label="Opportunity title" value={values.title}
              onChange={set('title')} error={errors.title}
              placeholder="Enterprise license deal" required
            />
            <div>
              <label htmlFor="stage" className="block text-xs font-medium text-gray-600 mb-1.5">Stage</label>
              <select
                id="stage" value={values.stage} onChange={e => set('stage')(e.target.value as OpportunityStage)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
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
                  ${errors.customerId ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
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
              <label htmlFor="leadId" className="block text-xs font-medium text-gray-600 mb-1.5">
                Lead (optional)
              </label>
              <select
                id="leadId"
                value={values.leadId}
                onChange={e => set('leadId')(e.target.value)}
                disabled={loadingLeads}
                className={`
                  w-full h-9 px-3 rounded-lg border text-sm text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                  border-gray-200 bg-white
                  ${loadingLeads ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <option value="">Select a lead (optional)...</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.firstName} {lead.lastName} - {lead.companyName || 'No Company'}
                  </option>
                ))}
              </select>
              {loadingLeads && <p className="text-xs text-gray-400 mt-1">Loading leads...</p>}
              {!loadingLeads && leads.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No leads available</p>
              )}
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Valuation</p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="estimatedValue" label="Estimated value (PHP)" value={values.estimatedValue}
              onChange={set('estimatedValue')} error={errors.estimatedValue}
              placeholder="75000" type="number"
            />
            <Field
              id="probability" label="Probability (%)" value={values.probability}
              onChange={set('probability')} error={errors.probability}
              placeholder="60" type="number"
              hint="Win probability 0–100"
            />
          </div>
          <div className="mt-4">
            <Field
              id="expectedCloseDate" label="Expected close date" value={values.expectedCloseDate}
              onChange={set('expectedCloseDate')} error={errors.expectedCloseDate}
              placeholder="YYYY-MM-DD" hint="e.g. 2025-06-30"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assignment</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignedToId" className="block text-xs font-medium text-gray-600 mb-1.5">
                Assigned to
              </label>
              <input
                id="assignedToId"
                type="text"
                value={values.assignedToId}
                onChange={e => set('assignedToId')(e.target.value)}
                placeholder="User GUID"
                readOnly={role === 'SalesRep' || role === 'SalesManager'}
                className={`
                  w-full h-9 px-3 rounded-lg border text-sm text-gray-900
                  placeholder:text-gray-400 transition-shadow
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                  ${(role === 'SalesRep' || role === 'SalesManager') 
                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
                    : 'bg-white border-gray-200'}
                `}
              />
              {(role === 'SalesRep' || role === 'SalesManager') && (
                <p className="text-xs text-gray-400 mt-1">Auto-assigned to you</p>
              )}
              {!values.assignedToId && (
                <p className="text-xs text-gray-400 mt-1">Sales rep responsible</p>
              )}
            </div>
            <div>
              <label htmlFor="primaryContactId" className="block text-xs font-medium text-gray-600 mb-1.5">
                Primary contact
              </label>
              <select
                id="primaryContactId"
                value={values.primaryContactId}
                onChange={e => set('primaryContactId')(e.target.value)}
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
                    {contact.firstName} {contact.lastName} {contact.jobTitle ? `(${contact.jobTitle})` : ''}
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
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <Textarea
            id="notes" label="Notes" value={values.notes}
            onChange={set('notes')} placeholder="Any additional context about this opportunity…"
          />
        </div>
      </div>
    </form>
  )
}

export const OPPORTUNITY_FORM_ID = 'opportunity-form'
