import { and, eq } from 'drizzle-orm'
import { dashboardConfigs } from '../database/schema'
import { db } from '../utils/db'

export interface WidgetConfig {
  id: string
  type: string
  w: number
  h: number
  settings: Record<string, unknown>
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'stats', type: 'DashboardStats', w: 12, h: 1, settings: {} },
  { id: 'chart', type: 'HomeChart', w: 12, h: 4, settings: {} },
  { id: 'sales', type: 'HomeSales', w: 4, h: 4, settings: {} },
  { id: 'inventory', type: 'HomeLowStock', w: 4, h: 4, settings: {} },
  { id: 'fuel', type: 'HomeFuelAnomalyWidget', w: 4, h: 4, settings: {} }
]

export const dashboardConfigService = {
  async getConfig(userId: string, organizationId: string) {
    const [config] = await db
      .select()
      .from(dashboardConfigs)
      .where(
        and(
          eq(dashboardConfigs.userId, userId),
          eq(dashboardConfigs.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!config) {
      return {
        userId,
        organizationId,
        layout: DEFAULT_LAYOUT
      }
    }

    return config
  },

  async saveConfig(userId: string, organizationId: string, layout: WidgetConfig[]) {
    const existing = (await this.getConfig(userId, organizationId)) as { id?: string }

    if (existing.id) {
      const [updated] = await db
        .update(dashboardConfigs)
        .set({ layout: layout as unknown as Record<string, unknown>[], updatedAt: new Date() })
        .where(eq(dashboardConfigs.id, existing.id))
        .returning()
      return updated
    } else {
      const [inserted] = await db
        .insert(dashboardConfigs)
        .values({
          userId,
          organizationId,
          layout: layout as unknown as Record<string, unknown>[]
        })
        .returning()
      return inserted
    }
  }
}
