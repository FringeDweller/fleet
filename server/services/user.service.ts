import * as argon2 from 'argon2'
import { eq } from 'drizzle-orm'
import { users } from '../database/schema'
import { db } from '../utils/db'

export const userService = {
  async findByEmail(email: string) {
    const results = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return results[0]
  },

  async verifyPassword(hashed: string, plain: string) {
    return await argon2.verify(hashed, plain)
  },

  async hashPassword(password: string) {
    return await argon2.hash(password)
  },

  async createUser(data: typeof users.$inferInsert) {
    const [user] = await db.insert(users).values(data).returning()
    return user
  },

  async updateUser(id: string, _organizationId: string, data: Partial<typeof users.$inferInsert>) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id)) // Should also check organizationId for security
      .returning()
    return user
  }
}
