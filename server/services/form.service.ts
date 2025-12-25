import { eq, and, desc } from 'drizzle-orm'
import { db } from '../utils/db'
import { customForms } from '../database/schema'

export const formService = {
  async listForms(organizationId: string) {
    return await db.select()
      .from(customForms)
      .where(eq(customForms.organizationId, organizationId))
      .orderBy(desc(customForms.createdAt))
  },

  async getForm(id: string, organizationId: string) {
    const result = await db.select()
      .from(customForms)
      .where(and(
        eq(customForms.id, id),
        eq(customForms.organizationId, organizationId)
      ))
      .limit(1)
    
    return result[0]
  },

  async createForm(data: typeof customForms.$inferInsert) {
    const [form] = await db.insert(customForms)
      .values(data)
      .returning()
    return form
  },

  async updateForm(id: string, organizationId: string, data: Partial<typeof customForms.$inferInsert>) {
    const [form] = await db.update(customForms)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(customForms.id, id),
        eq(customForms.organizationId, organizationId)
      ))
      .returning()
    return form
  },

  async deleteForm(id: string, organizationId: string) {
    await db.delete(customForms)
      .where(and(
        eq(customForms.id, id),
        eq(customForms.organizationId, organizationId)
      ))
  }
}
