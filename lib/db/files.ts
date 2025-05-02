import { sql } from "./client"
import { nanoid } from "nanoid"

interface FileData {
  lead_id: string
  url: string
  filename: string
  filesize: number
  category?: string
}

interface FileRecord {
  id: string
  lead_id: string
  url: string
  name: string
  size: number
  type: string
  category?: string
  created_at: Date
}

/**
 * Creates a file record in the database
 */
export async function createFile(data: FileData): Promise<FileRecord> {
  try {
    const id = nanoid()
    const now = new Date()
    
    // Determine file type from filename
    const fileExtension = data.filename.split('.').pop()?.toLowerCase() || ''
    let fileType = 'application/octet-stream'
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
      fileType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`
    } else if (['pdf'].includes(fileExtension)) {
      fileType = 'application/pdf'
    } else if (['doc', 'docx'].includes(fileExtension)) {
      fileType = 'application/msword'
    } else if (['xls', 'xlsx'].includes(fileExtension)) {
      fileType = 'application/vnd.ms-excel'
    }

    const result = await sql`
      INSERT INTO files (
        id,
        lead_id,
        url,
        name,
        size,
        type,
        category,
        created_at
      ) VALUES (
        ${id},
        ${data.lead_id},
        ${data.url},
        ${data.filename},
        ${data.filesize},
        ${fileType},
        ${data.category || null},
        ${now}
      )
      RETURNING 
        id, 
        lead_id, 
        url, 
        name, 
        size, 
        type, 
        category,
        created_at
    `

    if (!result || result.length === 0) {
      throw new Error("Failed to create file record: No rows returned")
    }

    const fileRecord: FileRecord = {
      id: result[0].id,
      lead_id: result[0].lead_id,
      url: result[0].url,
      name: result[0].name,
      size: result[0].size,
      type: result[0].type,
      category: result[0].category,
      created_at: new Date(result[0].created_at)
    };

    console.log("File record created successfully:", fileRecord)
    return fileRecord
  } catch (error) {
    console.error("Error creating file record:", error)
    throw new Error(`Failed to create file record: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Deletes a file record from the database and returns the deleted record
 */
export async function deleteFile(id: string): Promise<FileRecord | null> {
  try {
    console.log(`Deleting file with ID ${id}`)
    
    // First, get the file details before deletion
    const fileResult = await sql`
      SELECT id, lead_id, url, name, size, type, category, created_at
      FROM files 
      WHERE id = ${id}
    `
    
    if (!fileResult || fileResult.length === 0) {
      console.warn(`File with ID ${id} not found for deletion`)
      return null
    }

    const fileRecord: FileRecord = {
      id: fileResult[0].id,
      lead_id: fileResult[0].lead_id,
      url: fileResult[0].url,
      name: fileResult[0].name,
      size: fileResult[0].size,
      type: fileResult[0].type,
      category: fileResult[0].category,
      created_at: new Date(fileResult[0].created_at)
    };
    
    // Delete the file record
    await sql`DELETE FROM files WHERE id = ${id}`
    
    console.log(`File ${id} deleted successfully from database`)
    return fileRecord
  } catch (error) {
    console.error(`Error deleting file with ID ${id}:`, error)
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
} 