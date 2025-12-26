import { eq, and, desc } from 'drizzle-orm'
import { db } from '../utils/db'
import { formSubmissions } from '../database/schema'

export const formSubmissionService = {
  async submitForm(data: typeof formSubmissions.$inferInsert) {
    const [submission] = await db.insert(formSubmissions)
      .values(data)
      .returning()
    return submission
  },

  async listSubmissions(organizationId: string, options: {
    formId?: string
    targetModule?: string
    targetId?: string
  } = {}) {
    const where = [eq(formSubmissions.organizationId, organizationId)]

    if (options.formId) where.push(eq(formSubmissions.formId, options.formId))
    if (options.targetModule) where.push(eq(formSubmissions.targetModule, options.targetModule))
    if (options.targetId) where.push(eq(formSubmissions.targetId, options.targetId))

    return await db.select()
      .from(formSubmissions)
      .where(and(...where))
      .orderBy(desc(formSubmissions.createdAt))
  },

  async getSubmission(id: string, organizationId: string) {
    const result = await db.select()
      .from(formSubmissions)
      .where(and(
        eq(formSubmissions.id, id),
        eq(formSubmissions.organizationId, organizationId)
      ))
      .limit(1)

    return result[0]
  }
}
