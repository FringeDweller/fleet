import { eq } from 'drizzle-orm'
import * as argon2 from 'argon2'
import { db } from '../utils/db'
import { users } from '../database/schema'

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
  }
}
