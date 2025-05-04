-- Add leadId column to VisionMarker table
ALTER TABLE "VisionMarker" ADD COLUMN "leadId" VARCHAR(255);

-- Add unique constraint to leadId column
ALTER TABLE "VisionMarker" ADD CONSTRAINT "VisionMarker_leadId_key" UNIQUE ("leadId");

-- Add foreign key constraint to leadId column
ALTER TABLE "VisionMarker" ADD CONSTRAINT "VisionMarker_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index on leadId column
CREATE INDEX "VisionMarker_leadId_idx" ON "VisionMarker"("leadId"); 