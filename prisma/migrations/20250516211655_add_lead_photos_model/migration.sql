/*
  Warnings:

  - The primary key for the `Activity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `status` on the `Activity` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Activity_type_idx";

-- AlterTable
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_pkey",
DROP COLUMN "status",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "Activity_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "googleDriveUrl" TEXT,
ADD COLUMN     "metadata" JSONB;

-- DropEnum
DROP TYPE "ActivityStatus";

-- CreateTable
CREATE TABLE "LeadPhoto" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "leadId" VARCHAR(255) NOT NULL,
    "uploadedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LeadPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadPhoto_leadId_idx" ON "LeadPhoto"("leadId");

-- CreateIndex
CREATE INDEX "LeadPhoto_uploadedById_idx" ON "LeadPhoto"("uploadedById");

-- AddForeignKey
ALTER TABLE "LeadPhoto" ADD CONSTRAINT "LeadPhoto_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPhoto" ADD CONSTRAINT "LeadPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
