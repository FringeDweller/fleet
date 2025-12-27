import { eq, and, desc, inArray } from 'drizzle-orm'
import { db } from '../utils/db'
import { customForms, formAssignments } from '../database/schema'

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
  },

  async listAssignments(organizationId: string, formId?: string) {
    const where = [eq(formAssignments.organizationId, organizationId)]
    if (formId) where.push(eq(formAssignments.formId, formId))

    return await db.select()
      .from(formAssignments)
      .where(and(...where))
  },

  async createAssignment(data: typeof formAssignments.$inferInsert) {
    const [assignment] = await db.insert(formAssignments)
      .values(data)
      .returning()
    return assignment
  },

  async deleteAssignment(id: string, organizationId: string) {
    await db.delete(formAssignments)
      .where(and(
        eq(formAssignments.id, id),
        eq(formAssignments.organizationId, organizationId)
      ))
  },

  async getFormsForContext(organizationId: string, module: string, context: Record<string, unknown> = {}) {
    const assignments = await db.select()
      .from(formAssignments)
      .where(and(
        eq(formAssignments.organizationId, organizationId),
        eq(formAssignments.targetModule, module)
      ))

    const validFormIds = assignments
      .filter((a) => {
        const conds = a.conditions as Record<string, unknown>
        if (!conds || Object.keys(conds).length === 0) return true
        return Object.entries(conds).every(([k, v]) => context[k] === v)
      })
      .map(a => a.formId)

    if (validFormIds.length === 0) return []

    return await db.select()
      .from(customForms)
      .where(and(
        eq(customForms.organizationId, organizationId),
        eq(customForms.status, 'published'),
        inArray(customForms.id, validFormIds)
      ))
  }
}
