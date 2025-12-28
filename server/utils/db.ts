import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

const queryClient = postgres(process.env.DATABASE_URL!)
export const db = drizzle(queryClient, { schema })

const readUrl = process.env.DATABASE_READ_URL
const replicaClient = readUrl ? postgres(readUrl) : queryClient
export const replica = readUrl ? drizzle(replicaClient, { schema }) : db
