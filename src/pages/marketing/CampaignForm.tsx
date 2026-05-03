
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import type {
  CampaignFormValues,
  CampaignFormErrors,
  CreateCampaignRequest,
} from '@/types/campaign.types'
import { emptyCampaignForm } from '@/types/campaign.types'

interface CampaignFormProps {
  onSubmit:   (request: CreateCampaignRequest) => Promise<void>
  submitting: boolean
  initialData?: CampaignFormValues
}

function validate(v: CampaignFormValues): CampaignFormErrors {
  const e: CampaignFormErrors = {}
  if (!v.name.trim())
    e.name = 'Campaign name is required.'
  if (v.budget && isNaN(Number(v.budget)))
    e.budget = 'Budget must be a valid number.'
  if (v.budget && Number(v.budget) < 0)
    e.budget = 'Budget cannot be negative.'
  if (v.startDate && v.endDate && v.endDate < v.startDate)
    e.endDate = 'End date must be on or after start date.'
  return e
}

function toRequest(v: CampaignFormValues): CreateCampaignRequest {
  const n = (s: string) => s.trim() || null
  return {
    name:           v.name.trim(),
    description:    n(v.description),
    channel:        n(v.channel),
    budget:         v.budget ? Number(v.budget) : null,
    targetAudience: n(v.targetAudience),
    startDate:      n(v.startDate),
    endDate:        n(v.endDate),
  }
}

export const CAMPAIGN_FORM_ID = 'campaign-form'

interface FieldProps {
  id: keyof CampaignFormValues
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  hint?: string
  rows?: number
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  error?: string
}

function Field({
  id, label, type = 'text', placeholder = '', required = false,
  hint, rows, value, onChange, error,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {rows ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={`
            w-full px-3 py-2 rounded-lg border text-sm text-gray-900
            placeholder:text-gray-400 resize-none transition-shadow
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
          `}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full h-9 px-3 rounded-lg border text-sm text-gray-900
            placeholder:text-gray-400 transition-shadow
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
          `}
        />
      )}
      {hint && !error && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  )
}

export default function CampaignForm({ onSubmit, initialData }: CampaignFormProps) {
  const [values, setValues] = useState<CampaignFormValues>(initialData ?? emptyCampaignForm)
  const [errors, setErrors] = useState<CampaignFormErrors>({})

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setValues(initialData)
      setErrors({})
    } else {
      setValues(emptyCampaignForm)
      setErrors({})
    }
  }, [initialData])

  const set = (field: keyof CampaignFormValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues(v => ({ ...v, [field]: e.target.value }))
      if (errors[field as keyof CampaignFormErrors])
        setErrors(prev => { const n = { ...prev }; delete n[field as keyof CampaignFormErrors]; return n })
    }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    await onSubmit(toRequest(values))
    setValues(emptyCampaignForm)
    setErrors({})
  }

  return (
    <form id={CAMPAIGN_FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field 
        id="name" 
        label="Campaign name" 
        required 
        placeholder="Q2 Product Launch" 
        value={values.name}
        onChange={set('name')}
        error={errors.name}
      />
      <Field 
        id="channel" 
        label="Channel" 
        placeholder="Email, Social, Paid…" 
        value={values.channel}
        onChange={set('channel')}
        error={errors.channel}
      />
      <Field 
        id="targetAudience" 
        label="Target audience" 
        rows={3} 
        placeholder="Describe your target audience…" 
        value={values.targetAudience}
        onChange={set('targetAudience')}
        error={errors.targetAudience}
      />
      <Field
        id="budget"
        label="Budget (PHP)"
        type="number"
        placeholder="0.00"
        hint="Leave blank for no budget cap"
        value={values.budget}
        onChange={set('budget')}
        error={errors.budget}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field 
          id="startDate" 
          label="Start date" 
          type="date" 
          value={values.startDate}
          onChange={set('startDate')}
          error={errors.startDate}
        />
        <Field 
          id="endDate" 
          label="End date" 
          type="date" 
          value={values.endDate}
          onChange={set('endDate')}
          error={errors.endDate}
        />
      </div>
      <Field 
        id="description" 
        label="Description" 
        rows={2} 
        placeholder="Optional campaign notes…" 
        value={values.description}
        onChange={set('description')}
        error={errors.description}
      />
    </form>
  )
}