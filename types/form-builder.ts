export type FieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'date'
  | 'time'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'photo'
  | 'signature'
  | 'section'

export interface Condition {
  field: string // target field key
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt'
  value: string | number | boolean
}

export interface FieldLogic {
  action: 'show' | 'hide'
  match: 'all' | 'any'
  conditions: Condition[]
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  key: string // unique key for data binding
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: { label: string; value: string }[] // For select, radio
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  logic?: FieldLogic
}

export interface FormSchema {
  fields: FormField[]
}
