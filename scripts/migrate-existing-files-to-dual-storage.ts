/**
 * Migration script to update existing files to use dual storage
 * This will populate the new fields (blobUrl, driveFileId, storageLocation) for existing files
 */

import { prisma } from '../lib/db/prisma';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

interface MigrationResult {
  totalFiles: number;
  migrated: number;
  failed: number;
  skipped: number;
  errors: string[];
}

async function migrateExistingFiles(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalFiles: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    console.log('🔄 Starting migration of existing files to dual storage...');

    // Get all existing files that don't have dual storage fields set
    const existingFiles = await prisma.file.findMany({
      where: {
        OR: [
          { storageLocation: 'drive' },
          { storageLocation: { equals: null } },
          { blobUrl: { equals: null } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    result.totalFiles = existingFiles.length;
    console.log(`📂 Found ${result.totalFiles} files to migrate`);

    if (result.totalFiles === 0) {
      console.log('✅ No files need migration');
      return result;
    }

    for (const file of existingFiles) {
      try {
        console.log(`📁 Processing file: ${file.name} (${file.id})`);

        // Extract Google Drive file ID from URL if possible
        let driveFileId = file.driveFileId;
        if (!driveFileId && file.url) {
          const driveMatch = file.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (driveMatch) {
            driveFileId = driveMatch[1];
          }
        }

        // For now, just update the metadata without re-uploading files
        // In a future enhancement, we could download from Drive and upload to Blob
        
        const updateData: any = {
          storageLocation: 'drive',
          driveFileId: driveFileId || undefined
        };

        await prisma.file.update({
          where: { id: file.id },
          data: updateData
        });

        result.migrated++;
        console.log(`✅ Updated file metadata: ${file.name}`);

      } catch (error) {
        result.failed++;
        const errorMsg = `Failed to migrate ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`Total files: ${result.totalFiles}`);
    console.log(`Migrated: ${result.migrated}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Skipped: ${result.skipped}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    return result;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

// Helper function to copy files from Drive to Blob (for future use)
async function copyFileFromDriveToBlob(
  driveFileId: string,
  fileName: string,
  leadId: string,
  fileType: string
): Promise<string | null> {
  try {
    // Download from Google Drive
    const driveResponse = await fetch(`https://drive.google.com/uc?id=${driveFileId}&export=download`);
    if (!driveResponse.ok) {
      throw new Error(`Failed to download from Drive: ${driveResponse.status}`);
    }

    const fileBlob = await driveResponse.blob();
    
    // Upload to Vercel Blob
    const uniqueId = nanoid();
    const extension = fileName.split('.').pop() || 'bin';
    const blobFileName = `${uniqueId}.${extension}`;
    const blobPath = `leads/${leadId}/${fileType}/${blobFileName}`;

    const { url } = await put(blobPath, fileBlob, {
      access: 'public',
      addRandomSuffix: false,
      contentType: fileBlob.type || 'application/octet-stream',
      cacheControl: 'public, max-age=31536000, immutable',
    });

    return url;
  } catch (error) {
    console.error('Failed to copy file from Drive to Blob:', error);
    return null;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateExistingFiles()
    .then((result) => {
      console.log('\n🎉 Migration completed!');
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateExistingFiles };