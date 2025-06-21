import { prisma } from './prisma'
import { File } from '@prisma/client'

interface CreateFileInput {
  leadId: string
  url: string
  filename: string
  filesize: number
  category?: string
}

/**
 * Creates a file record in the database
 */
export async function createFile(data: CreateFileInput): Promise<File> {
  try {
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

    const file = await prisma.file.create({
      data: {
        url: data.url,
        name: data.filename,
        size: data.filesize,
        type: fileType,
        category: data.category,
        leadId: data.leadId
      }
    })

    console.log("File record created successfully:", file)
    return file
  } catch (error) {
    console.error("Error creating file record:", error)
    throw new Error(`Failed to create file record: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Gets all files for a lead
 */
export async function getFilesByLeadId(leadId: string): Promise<File[]> {
  try {
    const files = await prisma.file.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' }
    })
    return files
  } catch (error) {
    console.error(`Error fetching files for lead ${leadId}:`, error)
    throw new Error(`Failed to fetch files: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Gets a single file by ID
 */
export async function getFileById(id: string): Promise<File | null> {
  try {
    const file = await prisma.file.findUnique({
      where: { id }
    })
    return file
  } catch (error) {
    console.error(`Error fetching file ${id}:`, error)
    throw new Error(`Failed to fetch file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Deletes a file record from the database and returns the deleted record
 */
export async function deleteFile(id: string): Promise<File | null> {
  try {
    console.log(`Deleting file with ID ${id}`)
    
    const file = await prisma.file.delete({
      where: { id }
    })
    
    console.log(`File ${id} deleted successfully from database`)
    return file
  } catch (error) {
    console.error(`Error deleting file with ID ${id}:`, error)
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Gets the most recent files across all leads with pagination
 */
export async function getRecentFiles(page: number, limit: number) {
  try {
    const skip = (page - 1) * limit
    const files = await prisma.file.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return files
  } catch (error) {
    console.error('Error fetching recent files:', error)
    throw new Error(`Failed to fetch recent files: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Gets the total count of files stored in the system
 */
export async function getTotalFilesCount() {
  try {
    return await prisma.file.count()
  } catch (error) {
    console.error('Error counting files:', error)
    throw new Error(`Failed to count files: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
} 