// Simple database client for PostgreSQL
import { neon } from "@neondatabase/serverless"

// Create a SQL client with the connection string
export const sql = neon(process.env.DATABASE_URL!)

// Export the SQL client as the default export
export default sql
