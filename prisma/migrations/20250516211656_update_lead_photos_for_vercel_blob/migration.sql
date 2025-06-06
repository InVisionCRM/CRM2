-- Drop the driveFileId column since we're not using Google Drive anymore
ALTER TABLE "LeadPhoto" DROP COLUMN "driveFileId";

-- Add indexes for better query performance
CREATE INDEX "LeadPhoto_createdAt_idx" ON "LeadPhoto"("createdAt");
CREATE INDEX "LeadPhoto_updatedAt_idx" ON "LeadPhoto"("updatedAt"); 