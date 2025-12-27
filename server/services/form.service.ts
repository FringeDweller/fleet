import { eq, and, desc, inArray, sql, ne } from 'drizzle-orm'
import { db } from '../utils/db'
import { customForms, formAssignments } from '../database/schema'

export const formService = {
  async listForms(organizationId: string) {
    return await db.select()
      .from(customForms)
      .where(eq(customForms.organizationId, organizationId))
      .orderBy(desc(customForms.version), desc(customForms.updatedAt))
  },

  async listLatestForms(organizationId: string) {
    const all = await db.select()
      .from(customForms)
      .where(eq(customForms.organizationId, organizationId))
      .orderBy(desc(customForms.version), desc(customForms.updatedAt))

    const latestMap = new Map()
    for (const f of all) {
      const gid = f.formGroupId || f.id
      if (!latestMap.has(gid)) {
        latestMap.set(gid, f)
      }
    }
    return Array.from(latestMap.values())
  },

  async getFormVersions(formGroupId: string, organizationId: string) {
    return await db.select()
      .from(customForms)
      .where(and(
        eq(customForms.formGroupId, formGroupId),
        eq(customForms.organizationId, organizationId)
      ))
      .orderBy(desc(customForms.version))
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
      .values({
        ...data,
        version: data.version ?? 1,
        status: data.status ?? 'draft'
      })
      .returning()

    if (!form) return null

    // If formGroupId was not provided, it means it's the first version
    if (!form.formGroupId) {
      await db.update(customForms)
        .set({ formGroupId: form.id })
        .where(eq(customForms.id, form.id))
      form.formGroupId = form.id
    }

    return form
  },

  async updateForm(id: string, organizationId: string, data: Partial<typeof customForms.$inferInsert>) {
    const existing = await this.getForm(id, organizationId)
    if (!existing) return null

    // If the form is published, we create a new draft version instead of updating it
    if (existing.status === 'published' && (data.schema || data.title)) {
      // Check if a draft already exists for this group
      const draft = await db.select()
        .from(customForms)
        .where(and(
          eq(customForms.formGroupId, existing.formGroupId || existing.id),
          eq(customForms.status, 'draft'),
          eq(customForms.organizationId, organizationId)
        ))
        .limit(1)

      if (draft[0]) {
        // Update existing draft
        const [updatedDraft] = await db.update(customForms)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(customForms.id, draft[0].id))
          .returning()
        return updatedDraft
      } else {
        // Create new draft version
        const maxVersionResult = await db.select({ maxV: sql<number>`max(${customForms.version})` })
          .from(customForms)
          .where(eq(customForms.formGroupId, existing.formGroupId || existing.id))

        const newVersion = (maxVersionResult[0]?.maxV || existing.version) + 1
        return await this.createForm({
          ...existing,
          ...data,
          id: undefined, // Let it generate a new ID
          version: newVersion,
          status: 'draft',
          formGroupId: existing.formGroupId || existing.id,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }

    const [form] = await db.update(customForms)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(customForms.id, id),
        eq(customForms.organizationId, organizationId)
      ))
      .returning()
    return form
  },

  async publishForm(id: string, organizationId: string) {
    const existing = await this.getForm(id, organizationId)
    if (!existing) return null

    if (existing.status === 'published') return existing

    const formGroupId = existing.formGroupId || existing.id

    // Find all versions of this form group
    const allVersions = await db.select({ id: customForms.id })
      .from(customForms)
      .where(eq(customForms.formGroupId, formGroupId))

    // Archive all other versions of this form
    await db.update(customForms)
      .set({ status: 'archived' })
      .where(and(
        eq(customForms.formGroupId, formGroupId),
        ne(customForms.id, id),
        eq(customForms.organizationId, organizationId)
      ))

    // Update assignments to point to this new version
    if (allVersions.length > 0) {
      await db.update(formAssignments)
        .set({ formId: id })
        .where(inArray(formAssignments.formId, allVersions.map(v => v.id)))
    }

    // Publish this version
    const [published] = await db.update(customForms)
      .set({ status: 'published', updatedAt: new Date() })
      .where(eq(customForms.id, id))
      .returning()

    return published
  },

  async rollbackToVersion(id: string, organizationId: string) {
    const target = await this.getForm(id, organizationId)
    if (!target) return null

    const formGroupId = target.formGroupId || target.id

    // Find all versions of this form group
    const allVersions = await db.select({ id: customForms.id })
      .from(customForms)
      .where(eq(customForms.formGroupId, formGroupId))

    // Archive all other versions of this form
    await db.update(customForms)
      .set({ status: 'archived' })
      .where(and(
        eq(customForms.formGroupId, formGroupId),
        ne(customForms.id, id),
        eq(customForms.organizationId, organizationId)
      ))

    // Update assignments to point to this version
    if (allVersions.length > 0) {
      await db.update(formAssignments)
        .set({ formId: id })
        .where(inArray(formAssignments.formId, allVersions.map(v => v.id)))
    }

    // Publish the target version
    const [published] = await db.update(customForms)
      .set({ status: 'published', updatedAt: new Date() })
      .where(eq(customForms.id, id))
      .returning()

    return published
  },

  async deleteForm(id: string, organizationId: string) {
    const form = await this.getForm(id, organizationId)
    if (!form) return

    // If it's the only version, we can delete it.
    // But usually, we might want to archive it.
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
