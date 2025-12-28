import { eq } from 'drizzle-orm'
import { assetCategories, assets } from '../database/schema'
import { db } from '../utils/db'

export interface ImportField {
  key: string
  label: string
  required: boolean
  description?: string
}

export interface ImportError {
  row: number
  message: string
}

export interface ImportResult {
  created: number
  updated: number
  errors: ImportError[]
}

export interface ImportHandler {
  getFields(): ImportField[]
  validate(
    rows: Record<string, any>[],
    organizationId: string
  ): Promise<{ validRows: any[]; invalidRows: any[]; errors: ImportError[] }>
  execute(validRows: any[], organizationId: string): Promise<ImportResult>
}

class AssetImportHandler implements ImportHandler {
  getFields(): ImportField[] {
    return [
      { key: 'assetNumber', label: 'Asset Number', required: true },
      { key: 'make', label: 'Make', required: true },
      { key: 'model', label: 'Model', required: true },
      { key: 'year', label: 'Year', required: true },
      {
        key: 'category',
        label: 'Category Name',
        required: true,
        description: 'Must match an existing category'
      },
      { key: 'vin', label: 'VIN', required: false },
      { key: 'licensePlate', label: 'License Plate', required: false },
      { key: 'status', label: 'Status', required: false },
      { key: 'currentMileage', label: 'Current Mileage', required: false },
      { key: 'currentHours', label: 'Current Hours', required: false }
    ]
  }

  async validate(
    rows: Record<string, any>[],
    organizationId: string
  ): Promise<{ validRows: any[]; invalidRows: any[]; errors: ImportError[] }> {
    const errors: ImportError[] = []
    const validRows: any[] = []
    const invalidRows: any[] = []

    // Fetch categories for lookup
    const categories = await db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.organizationId, organizationId))
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]))

    // Fetch existing asset numbers to minimize DB constraint errors
    // Note: Schema has global unique on assetNumber, but realistically we check within org first.
    // If strict global unique is required, we should check global.
    // For now assuming we just want to avoid obvious dupes.
    const existingAssets = await db.select({ assetNumber: assets.assetNumber }).from(assets)
    const existingAssetNumbers = new Set(existingAssets.map((a) => a.assetNumber.toLowerCase()))

    for (const [i, row] of rows.entries()) {
      const rowErrors: string[] = []
      const rowIndex = i + 1

      // Required fields check
      if (!row.assetNumber) rowErrors.push('Asset Number is required')
      if (!row.make) rowErrors.push('Make is required')
      if (!row.model) rowErrors.push('Model is required')
      if (!row.year) rowErrors.push('Year is required')
      if (!row.category) rowErrors.push('Category is required')

      // Uniqueness check
      if (row.assetNumber && existingAssetNumbers.has(String(row.assetNumber).toLowerCase())) {
        rowErrors.push(`Asset Number '${row.assetNumber}' already exists`)
      }

      // Category lookup
      let categoryId: string | undefined
      if (row.category) {
        categoryId = categoryMap.get(String(row.category).toLowerCase())
        if (!categoryId) {
          rowErrors.push(`Category '${row.category}' not found`)
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowIndex, message: rowErrors.join('; ') })
        invalidRows.push({ ...row, _errors: rowErrors })
      } else {
        validRows.push({ ...row, categoryId })
      }
    }

    return { validRows, invalidRows, errors }
  }

  async execute(validRows: any[], organizationId: string): Promise<ImportResult> {
    if (validRows.length === 0) return { created: 0, updated: 0, errors: [] }

    const records = validRows.map((row) => ({
      organizationId,
      assetNumber: String(row.assetNumber),
      make: String(row.make),
      model: String(row.model),
      year: Number(row.year),
      categoryId: row.categoryId, // Resolved in validation
      vin: row.vin ? String(row.vin) : undefined,
      licensePlate: row.licensePlate ? String(row.licensePlate) : undefined,
      status: row.status || 'active',
      currentMileage: row.currentMileage ? String(row.currentMileage) : '0',
      currentHours: row.currentHours ? String(row.currentHours) : '0'
    }))

    // Batch insert
    try {
      await db.insert(assets).values(records)
      return { created: records.length, updated: 0, errors: [] }
    } catch (e: any) {
      console.error('Bulk insert failed', e)
      // If one fails in a batch, all fail.
      // We could switch to one-by-one or ON CONFLICT DO NOTHING but requirement implies "Import with error report".
      // For now, fail the batch.
      return {
        created: 0,
        updated: 0,
        errors: [{ row: 0, message: 'Batch insert failed: ' + e.message }]
      }
    }
  }
}

export const importService = {
  handlers: {
    assets: new AssetImportHandler()
  } as Record<string, ImportHandler>,

  getHandler(type: string) {
    const handler = this.handlers[type]
    if (!handler) throw new Error(`No import handler for type: ${type}`)
    return handler
  }
}
