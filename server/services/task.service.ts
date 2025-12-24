import { eq, and } from 'drizzle-orm'
import { db } from '../utils/db'
import { maintenanceTasks, taskGroups, taskParts } from '../database/schema'

export const taskService = {
  async listTasks(organizationId: string) {
    return await db.select().from(maintenanceTasks).where(eq(maintenanceTasks.organizationId, organizationId))
  },

  async getTaskById(id: string, organizationId: string) {
    const results = await db.select().from(maintenanceTasks).where(
      and(
        eq(maintenanceTasks.id, id),
        eq(maintenanceTasks.organizationId, organizationId)
      )
    ).limit(1)
    return results[0]
  },

  async createTask(data: typeof maintenanceTasks.$inferInsert) {
    const [task] = await db.insert(maintenanceTasks).values(data).returning()
    return task
  },

  async listGroups(organizationId: string) {
    return await db.select().from(taskGroups).where(eq(taskGroups.organizationId, organizationId))
  },

  async getTaskParts(taskId: string) {
    return await db.select().from(taskParts).where(eq(taskParts.taskId, taskId))
  },

  async addTaskPart(data: typeof taskParts.$inferInsert) {
    const [part] = await db.insert(taskParts).values(data).returning()
    return part
  }
}
