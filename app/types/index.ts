import type { AvatarProps } from '@nuxt/ui'

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
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
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
  anomalies: any[]
}
