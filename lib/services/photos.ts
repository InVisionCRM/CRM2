import { put, del } from '@vercel/blob';
import { nanoid } from 'nanoid';

export interface PhotoUploadResult {
  url: string;
  thumbnailUrl: string;
  filename: string;
  size: number;
}

export async function uploadPhotoToBlob(
  file: File,
  leadId: string,
  description?: string
): Promise<PhotoUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Only images are allowed.');
    }

    // Generate a unique filename
    const uniqueId = nanoid();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${uniqueId}.${extension}`;
    const pathname = `leads/${leadId}/photos/${filename}`;

    // Upload the original file
    const { url } = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year
    });

    // For now, use the same URL for thumbnail
    // In a production environment, you might want to generate and store actual thumbnails
    const thumbnailUrl = url;

    return {
      url,
      thumbnailUrl,
      filename: file.name,
      size: file.size,
    };
  } catch (error) {
    console.error('Error uploading photo to Vercel Blob:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload photo');
  }
}

export async function deletePhotoFromBlob(url: string): Promise<void> {
  try {
    if (!url) {
      throw new Error('URL is required for deletion');
    }
    await del(url);
  } catch (error) {
    console.error('Error deleting photo from Vercel Blob:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete photo');
  }
} 