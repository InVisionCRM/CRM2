/*
  Warnings:

  - The values [Not Visited,KNOCKED,INTERESTED,Appointment Set,Follow-up] on the enum `KnockStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "KnockStatus_new" AS ENUM ('No Answer', 'Not Interested', 'Follow up', 'INSPECTED', 'In Contract');
ALTER TABLE "VisionMarker" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "VisionMarker" ALTER COLUMN "status" TYPE "KnockStatus_new" USING ("status"::text::"KnockStatus_new");
ALTER TABLE "Visit" ALTER COLUMN "status" TYPE "KnockStatus_new" USING ("status"::text::"KnockStatus_new");
ALTER TYPE "KnockStatus" RENAME TO "KnockStatus_old";
ALTER TYPE "KnockStatus_new" RENAME TO "KnockStatus";
DROP TYPE "KnockStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "VisionMarker" ALTER COLUMN "status" DROP DEFAULT;
