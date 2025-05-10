/*
  Warnings:

  - The values [INITIAL_CONSULTATION,ESTIMATE,CONTRACT_SIGNING] on the enum `AppointmentPurpose` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentPurpose_new" AS ENUM ('INSPECTION', 'FILE_CLAIM', 'FOLLOW_UP', 'ADJUSTER', 'BUILD_DAY', 'OTHER');
ALTER TABLE "Appointment" ALTER COLUMN "purpose" TYPE "AppointmentPurpose_new" USING ("purpose"::text::"AppointmentPurpose_new");
ALTER TYPE "AppointmentPurpose" RENAME TO "AppointmentPurpose_old";
ALTER TYPE "AppointmentPurpose_new" RENAME TO "AppointmentPurpose";
DROP TYPE "AppointmentPurpose_old";
COMMIT;

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "refresh_token_expires_in" INTEGER;

-- CreateTable
CREATE TABLE "RoutePoint" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RoutePoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoutePoint_userId_idx" ON "RoutePoint"("userId");

-- CreateIndex
CREATE INDEX "RoutePoint_timestamp_idx" ON "RoutePoint"("timestamp");

-- AddForeignKey
ALTER TABLE "RoutePoint" ADD CONSTRAINT "RoutePoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
