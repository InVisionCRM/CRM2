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
    const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
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
export function isValidFileSize(file: File, maxSizeMB: number = 2): boolean {
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

/**
 * Resize an image file to reduce its size
 * @param file The image file to resize
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @param quality JPEG quality (0-1)
 * @returns Promise with the resized file
 */
export async function resizeImage(
  file: File, 
  maxWidth: number = 400, 
  maxHeight: number = 400, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Create image element
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not create blob'));
          return;
        }
        
        // Create new file
        const newFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        resolve(newFile);
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => {
      reject(new Error('Error loading image for resizing'));
    };
    
    // Load image from file
    img.src = URL.createObjectURL(file);
  });
} 