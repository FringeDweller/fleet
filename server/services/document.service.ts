import fs from 'node:fs/promises'
import path from 'node:path'
import { and, eq, ilike } from 'drizzle-orm'
import { documentCategories, documentLinks, documents } from '../database/schema'
import { db } from '../utils/db'

export const documentService = {
  async listDocuments(
    organizationId: string,
    options?: { categoryId?: string; search?: string; allVersions?: boolean }
  ) {
    const filters = [eq(documents.organizationId, organizationId)]
    if (!options?.allVersions) {
      filters.push(eq(documents.isLatest, true))
    }
    if (options?.categoryId) {
      filters.push(eq(documents.categoryId, options.categoryId))
    }
    if (options?.search) {
      filters.push(ilike(documents.name, `%${options.search}%`))
    }
    return await db
      .select()
      .from(documents)
      .where(and(...filters))
  },

  async listDocumentVersions(organizationId: string, rootId: string) {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.organizationId, organizationId), eq(documents.rootId, rootId)))
      .orderBy(documents.version)
  },

  async uploadVersion(
    organizationId: string,
    userId: string,
    rootId: string,
    file: { name: string; type: string; size: number; buffer: Buffer }
  ) {
    const [originalDoc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, rootId), eq(documents.organizationId, organizationId)))
      .limit(1)
    if (!originalDoc) throw new Error('Original document not found')

    const [latestDoc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.rootId, rootId), eq(documents.isLatest, true)))
      .limit(1)

    const nextVersion = (latestDoc?.version || originalDoc.version) + 1

    // Mark old ones as not latest
    await db
      .update(documents)
      .set({ isLatest: false })
      .where(and(eq(documents.rootId, rootId), eq(documents.organizationId, organizationId)))

    const uploadDir = path.join(process.cwd(), 'public/uploads', organizationId)
    await fs.mkdir(uploadDir, { recursive: true })

    const fileName = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadDir, fileName)
    await fs.writeFile(filePath, file.buffer)

    const url = `/uploads/${organizationId}/${fileName}`

    const [newDoc] = await db
      .insert(documents)
      .values({
        name: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        organizationId,
        createdBy: userId,
        categoryId: originalDoc.categoryId,
        expiryDate: originalDoc.expiryDate,
        rootId,
        version: nextVersion,
        isLatest: true
      })
      .returning()

    return newDoc
  },

  async listEntityDocuments(organizationId: string, entityType: string, entityId: string) {
    return await db
      .select({
        id: documents.id,
        name: documents.name,
        mimeType: documents.mimeType,
        size: documents.size,
        url: documents.url,
        categoryId: documents.categoryId,
        expiryDate: documents.expiryDate,
        createdAt: documents.createdAt
      })
      .from(documents)
      .innerJoin(documentLinks, eq(documents.id, documentLinks.documentId))
      .where(
        and(
          eq(documentLinks.organizationId, organizationId),
          eq(documentLinks.entityType, entityType),
          eq(documentLinks.entityId, entityId)
        )
      )
  },

  async linkDocument(
    organizationId: string,
    documentId: string,
    entityType: string,
    entityId: string
  ) {
    const [link] = await db
      .insert(documentLinks)
      .values({
        documentId,
        entityType,
        entityId,
        organizationId
      })
      .returning()
    return link
  },

  async unlinkDocument(
    organizationId: string,
    documentId: string,
    entityType: string,
    entityId: string
  ) {
    await db
      .delete(documentLinks)
      .where(
        and(
          eq(documentLinks.documentId, documentId),
          eq(documentLinks.entityType, entityType),
          eq(documentLinks.entityId, entityId),
          eq(documentLinks.organizationId, organizationId)
        )
      )
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
