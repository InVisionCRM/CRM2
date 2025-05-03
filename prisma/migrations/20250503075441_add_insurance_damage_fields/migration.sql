/*
  Warnings:

  - The values [No Answer,Not Interested,Follow up,In Contract] on the enum `KnockStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "DamageType" AS ENUM ('HAIL', 'WIND', 'FIRE');

-- AlterEnum
BEGIN;
CREATE TYPE "KnockStatus_new" AS ENUM ('KNOCKED', 'NO_ANSWER', 'NOT_INTERESTED', 'FOLLOW_UP', 'INSPECTED', 'IN_CONTRACT');
ALTER TABLE "VisionMarker" ALTER COLUMN "status" TYPE "KnockStatus_new" USING ("status"::text::"KnockStatus_new");
ALTER TABLE "Visit" ALTER COLUMN "status" TYPE "KnockStatus_new" USING ("status"::text::"KnockStatus_new");
ALTER TYPE "KnockStatus" RENAME TO "KnockStatus_old";
ALTER TYPE "KnockStatus_new" RENAME TO "KnockStatus";
DROP TYPE "KnockStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "claimNumber" TEXT,
ADD COLUMN     "damageType" "DamageType",
ADD COLUMN     "dateOfLoss" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "VisionMarker" ALTER COLUMN "status" SET DEFAULT 'KNOCKED';
