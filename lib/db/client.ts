import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Create a SQL client using the DATABASE_URL environment variable
export const sqlClient = neon(process.env.DATABASE_URL!)

export const db = drizzle(sqlClient)

// Re-export sql for direct query usage;
export { sqlClient as sql }
