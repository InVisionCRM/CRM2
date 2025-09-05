import { put, del } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { GoogleDriveService } from './googleDrive';
import { prisma } from '@/lib/db/prisma';

export interface DualStorageResult {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    url: string; // Primary URL (Vercel Blob preferred)
    blobUrl?: string;
    driveUrl?: string;
    driveFileId?: string;
    storageLocation: 'drive' | 'blob' | 'both';
    name: string;
    size: number;
    type: string;
    category?: string;
  };
}

export interface DualStorageOptions {
  leadId: string;
  fileType?: string;
  category?: string;
  customFileName?: string;
  description?: string;
}

export class DualFileStorageService {
  private driveService?: GoogleDriveService;

  constructor(accessToken?: string) {
    if (accessToken) {
      this.driveService = new GoogleDriveService({ accessToken });
    }
  }

  /**
   * Upload file to both Vercel Blob and Google Drive
   */
  async uploadFile(file: File, options: DualStorageOptions): Promise<DualStorageResult> {
    const { leadId, fileType, category, customFileName, description } = options;
    let blobUrl: string | null = null;
    let driveUrl: string | null = null;
    let driveFileId: string | null = null;
    let storageLocation: 'drive' | 'blob' | 'both' = 'blob';

    try {
      // 1. Upload to Vercel Blob (primary storage)
      console.log('📤 Uploading to Vercel Blob...');
      const blobResult = await this.uploadToBlob(file, options);
      blobUrl = blobResult.url;
      console.log('✅ Vercel Blob upload successful:', blobUrl);

      // 2. Upload to Google Drive (backup storage) - using Service Account
      console.log('📤 Uploading to Google Drive...');
      try {
        const driveResult = await this.uploadToDrive(file, options);
        if (driveResult.success && driveResult.data) {
          driveUrl = driveResult.data.webViewLink || driveResult.data.url;
          driveFileId = driveResult.data.id;
          storageLocation = 'both';
          console.log('✅ Google Drive upload successful:', driveUrl);
        }
      } catch (driveError) {
        console.warn('⚠️ Google Drive upload failed, continuing with Blob only:', driveError);
        // Continue with Blob-only storage
      }

      // 3. Save metadata to database
      const displayName = customFileName || file.name;
      const fileRecord = await prisma.file.create({
        data: {
          url: blobUrl, // Primary URL is Blob
          name: displayName,
          size: file.size,
          type: file.type,
          category: category || fileType,
          leadId,
          blobUrl,
          driveFileId,
          storageLocation,
        }
      });

      console.log('✅ File metadata saved to database:', fileRecord.id);

      return {
        success: true,
        data: {
          id: fileRecord.id,
          url: blobUrl, // Return Blob URL as primary
          blobUrl,
          driveUrl,
          driveFileId,
          storageLocation,
          name: displayName,
          size: file.size,
          type: file.type,
          category: category || fileType,
        }
      };

    } catch (error) {
      console.error('❌ Dual storage upload failed:', error);
      
      // Cleanup: try to delete any partially uploaded files
      if (blobUrl) {
        try {
          await del(blobUrl);
          console.log('🧹 Cleaned up Blob file after error');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup Blob file:', cleanupError);
        }
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  }

  /**
   * Upload file to Vercel Blob
   */
  private async uploadToBlob(file: File, options: DualStorageOptions) {
    const { leadId, fileType = 'file' } = options;
    
    // Generate unique filename
    const uniqueId = nanoid();
    const extension = file.name.split('.').pop() || 'bin';
    const filename = `${uniqueId}.${extension}`;
    const pathname = `leads/${leadId}/${fileType}/${filename}`;

    const { url } = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year
    });

    return { url, pathname, filename };
  }

  /**
   * Upload file to Google Drive using Service Account
   */
  private async uploadToDrive(file: File, options: DualStorageOptions) {
    const { leadId, fileType, customFileName } = options;

    // Use Service Account approach (similar to existing implementation)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('leadId', leadId);
    formData.append('fileType', fileType || 'other');
    
    if (customFileName) {
      formData.append('customFileName', customFileName);
    }

    // Need absolute URL for server-side fetch
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/files/upload-to-shared-drive`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Google Drive upload failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Delete file from both storages
   */
  async deleteFile(fileId: string): Promise<DualStorageResult> {
    try {
      // Get file record from database
      const fileRecord = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!fileRecord) {
        return {
          success: false,
          message: 'File not found'
        };
      }

      let errors: string[] = [];

      // Delete from Vercel Blob if exists
      if (fileRecord.blobUrl) {
        try {
          await del(fileRecord.blobUrl);
          console.log('✅ Deleted from Vercel Blob');
        } catch (error) {
          console.error('❌ Failed to delete from Blob:', error);
          errors.push('Blob deletion failed');
        }
      }

      // Delete from Google Drive if exists
      if (fileRecord.driveFileId) {
        try {
          const response = await fetch(`/api/files/delete-from-shared-drive?driveFileId=${fileRecord.driveFileId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            console.log('✅ Deleted from Google Drive');
          } else {
            throw new Error('Drive API error');
          }
        } catch (error) {
          console.error('❌ Failed to delete from Drive:', error);
          errors.push('Drive deletion failed');
        }
      }

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId }
      });

      console.log('✅ Deleted file record from database');

      return {
        success: true,
        message: errors.length > 0 ? `Partial deletion: ${errors.join(', ')}` : 'File deleted successfully'
      };

    } catch (error) {
      console.error('❌ Delete operation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  }

  /**
   * Get file URL with fallback logic
   */
  async getFileUrl(fileId: string): Promise<string | null> {
    try {
      const fileRecord = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!fileRecord) {
        return null;
      }

      // Prefer Blob URL, fallback to Drive URL
      return fileRecord.blobUrl || fileRecord.url;
    } catch (error) {
      console.error('❌ Failed to get file URL:', error);
      return null;
    }
  }

  /**
   * Get file download URL (for direct downloads)
   */
  async getDownloadUrl(fileId: string): Promise<string | null> {
    try {
      const fileRecord = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!fileRecord) {
        return null;
      }

      // For Blob URLs, they are direct download URLs
      if (fileRecord.blobUrl) {
        return fileRecord.blobUrl;
      }

      // For Drive URLs, we need to convert to download format
      if (fileRecord.driveFileId) {
        return `https://drive.google.com/uc?id=${fileRecord.driveFileId}&export=download`;
      }

      return fileRecord.url;
    } catch (error) {
      console.error('❌ Failed to get download URL:', error);
      return null;
    }
  }
}

export default DualFileStorageService;