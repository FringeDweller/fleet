import type { AvatarProps } from '@nuxt/ui'

export interface WidgetConfig {
  id: string
  type: string
  w: number
  h: number
  settings: Record<string, unknown>
}

export interface DashboardConfig {
  id: string
  userId: string
  organizationId: string
  layout: WidgetConfig[]
  createdAt: string
  updatedAt: string
}

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  to?: string
  inverseTrend?: boolean
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: string
  userId: string | null
  organizationId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  isRead: boolean
  link: string | null
  createdAt: string
  updatedAt: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface Asset {
  id: string
  assetNumber: string
  vin: string | null
  make: string
  model: string
  year: number
  licensePlate: string | null
  status: string
  categoryId: string
  organizationId: string
  currentMileage: string | null
  currentHours: string | null
  createdAt: string
  updatedAt: string
  categoryName?: string
}

export interface AssetCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface Part {
  id: string
  sku: string
  name: string
  description: string | null
  unit: string
  categoryId: string | null
  reorderThreshold: string
  reorderQuantity: string
  quantityOnHand: string
  unitCost: string
  organizationId: string
  createdAt: string
  updatedAt: string
  categoryName?: string
  history?: StockMovement[]
  inventoryLevels?: { locationId: string; locationName: string; quantity: string }[]
}

export interface PartCategory {
  id: string
  name: string
  description: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  partId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: string
  reason: string | null
  referenceType: 'work_order' | 'purchase_order' | 'manual' | null
  referenceId: string | null
  userId: string
  userName?: string
  organizationId: string
  createdAt: string
}

export interface FuelTransaction {
  id: string
  assetId: string
  operatorId: string
  transactionDate: string
  quantity: string
  unit: string
  totalCost: string
  currency: string
  odometer: string | null
  hours: string | null
  fuelType: string | null
  stationName: string | null
  receiptImage: string | null
  organizationId: string
  hlc: string | null
  createdAt: string
  updatedAt: string
}

export interface FuelAnalytics {
  totalLitres: number
  totalCost: number
  avgConsumption: number
  avgCostPerKm: number
  trends: {
    id: string
    date: string
    consumption: number
    costPerKm: number
    distance: number
    quantity: number
  }[]
  anomalies: Record<string, unknown>[]
}

export interface OperatorSession {
  id: string
  operatorId: string
  assetId: string
  startTime: string
  endTime: string | null
  startMileage: string | null
  endMileage: string | null
  startOdometer?: string | null
  endOdometer?: string | null
  startHours: string | null
  endHours: string | null
  startLocationLat: string | null
  startLocationLng: string | null
  endLocationLat: string | null
  endLocationLng: string | null
  organizationId: string
  status: 'active' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface Inspection {
  id: string
  assetId: string
  operatorId: string
  sessionId?: string | null
  status: 'passed' | 'failed' | 'pending'
  notes: string | null
  data: Record<string, unknown>
  checkpoints?: unknown[]
  startTime?: string
  endTime?: string
  location?: unknown
  results?: unknown[]
  signatureUrl?: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface AssetLocation {
  id: string
  assetId: string
  sessionId: string | null
  latitude: string
  longitude: string
  speed: string | null
  heading: string | null
  altitude: string | null
  organizationId: string
  hlc: string | null
  createdAt: string
  assetNumber: string
  assetMake: string
  assetModel: string
  assetStatus: string | null
}

export interface Geofence {
  id: string
  name: string
  description: string | null
  type: 'circle' | 'polygon'
  centerLat: string | null
  centerLng: string | null
  radius: string | null
  coordinates: { lat: number; lng: number }[] | null
  category: 'depot' | 'job_site' | 'restricted' | 'other'
  activeHours: unknown | null
  alertOnEntry: 'always' | 'never' | 'after_hours'
  alertOnExit: 'always' | 'never' | 'after_hours'
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  name: string
  mimeType: string
  size: number
  url: string
  categoryId: string | null
  expiryDate: string | null
  version: number
  rootId: string | null
  isLatest: boolean
  organizationId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface DocumentCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface FormAssignment {
  id: string
  formId: string
  targetModule: string
  targetId: string | null
  targetName?: string
  conditions: Record<string, unknown>
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface FormSubmission {
  id: string
  formId: string
  targetModule: string
  targetId: string
  data: Record<string, unknown>
  submittedBy: string
  organizationId: string
  createdAt: string
  updatedAt: string
}
