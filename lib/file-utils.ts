/**
 * Utility functions for handling file uploads and processing
 */

/**
 * Validates if the file is a valid image
 * @param file File to validate
 * @returns boolean indicating if the file is a valid image
 */
export const isValidImage = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return validTypes.includes(file.type)
}

/**
 * Validates if the file size is within allowed limits
 * @param file File to validate
 * @param maxSizeMB Maximum file size in MB
 * @returns boolean indicating if the file size is valid
 */
export const isValidFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Generates a unique filename for uploaded files
 * @param userId User ID
 * @param originalFilename Original filename
 * @returns A unique filename
 */
export const generateUniqueFilename = (userId: string, originalFilename: string): string => {
  const fileExt = originalFilename.split('.').pop() || 'jpg'
  return `${userId}-${Date.now()}.${fileExt}`
}

/**
 * Creates a public URL from a file path
 * @param path Relative path of the file
 * @returns Public URL
 */
export const getPublicUrl = (path: string): string => {
  // Make sure the path starts with a forward slash
  if (!path.startsWith('/')) {
    path = `/${path}`
  }
  return path
} 