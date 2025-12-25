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
}

export interface FormSchema {
  fields: FormField[]
}
