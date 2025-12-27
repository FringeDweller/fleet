import fs from 'node:fs/promises'
import path from 'node:path'
import { and, eq } from 'drizzle-orm'
import { documentCategories, documents } from '../database/schema'
import { db } from '../utils/db'

export const documentService = {
  async listDocuments(organizationId: string, categoryId?: string) {
    const filters = [eq(documents.organizationId, organizationId)]
    if (categoryId) {
      filters.push(eq(documents.categoryId, categoryId))
    }
    return await db
      .select()
      .from(documents)
      .where(and(...filters))
  },

  async listCategories(organizationId: string) {
    return await db
      .select()
      .from(documentCategories)
      .where(eq(documentCategories.organizationId, organizationId))
  },

  async createCategory(
    organizationId: string,
    data: { name: string; slug: string; parentId?: string }
  ) {
    const [category] = await db
      .insert(documentCategories)
      .values({
        ...data,
        organizationId
      })
      .returning()
    return category
  },

  async uploadDocument(
    organizationId: string,
    userId: string,
    file: { name: string; type: string; size: number; buffer: Buffer },
    metadata?: { categoryId?: string; expiryDate?: Date }
  ) {
    const uploadDir = path.join(process.cwd(), 'public/uploads', organizationId)
    await fs.mkdir(uploadDir, { recursive: true })

    const fileName = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadDir, fileName)
    await fs.writeFile(filePath, file.buffer)

    const url = `/uploads/${organizationId}/${fileName}`

    const [doc] = await db
      .insert(documents)
      .values({
        name: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        organizationId,
        createdBy: userId,
        categoryId: metadata?.categoryId,
        expiryDate: metadata?.expiryDate
      })
      .returning()

    return doc
  },

  async updateDocument(
    id: string,
    organizationId: string,
    data: { categoryId?: string; expiryDate?: Date; name?: string }
  ) {
    const [doc] = await db
      .update(documents)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(documents.id, id), eq(documents.organizationId, organizationId)))
      .returning()
    return doc
  },

  async deleteDocument(id: string, organizationId: string) {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.organizationId, organizationId)))
      .limit(1)
    if (!doc) return

    const filePath = path.join(process.cwd(), 'public', doc.url)
    try {
      await fs.unlink(filePath)
    } catch (err) {
      console.error('Failed to delete file', err)
    }

    await db.delete(documents).where(eq(documents.id, id))
  }
}
