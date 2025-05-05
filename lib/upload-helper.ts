/**
 * Helper functions for handling file uploads on the client side
 */

/**
 * Upload a file to the specified API endpoint
 * @param file The file to upload
 * @param endpoint The API endpoint to upload to
 * @param additionalData Additional form data to include
 * @returns Response from the API
 */
export async function uploadFile<T>(
  file: File,
  endpoint: string,
  additionalData: Record<string, string> = {}
): Promise<T> {
  // Create FormData object
  const formData = new FormData();
  
  // Add file to FormData
  formData.append('file', file);
  
  // Add additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  // Send POST request to endpoint
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });
  
  // Check if request was successful
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Upload failed');
  }
  
  // Return response data
  return response.json();
}

/**
 * Test if a file upload works
 * @param file The file to test upload
 * @returns Response from the test upload API
 */
export async function testFileUpload(file: File) {
  return uploadFile(file, '/api/test-upload');
}

/**
 * Validate if a file is a valid image
 * @param file The file to validate
 * @returns Boolean indicating if the file is a valid image
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Validate if a file is within the size limit
 * @param file The file to validate
 * @param maxSizeMB The maximum size in megabytes
 * @returns Boolean indicating if the file is valid
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Create a data URL from a file for previewing
 * @param file The file to preview
 * @returns Promise with the data URL
 */
export function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
} 