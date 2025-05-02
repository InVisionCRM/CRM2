/*
  Warnings:

  - The values [INITIAL_CONSULTATION,ESTIMATE,OTHER] on the enum `AppointmentPurpose` will be removed. If these variants are still used in the database, this will fail.
  - The values [CONFIRMED] on the enum `AppointmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Appointment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `date` on the `Appointment` table. All the data in the column will be lost.
  - Changed the type of `startTime` on the `Appointment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `Appointment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentPurpose_new" AS ENUM ('INITIAL_ASSESSMENT', 'MEASUREMENT', 'PROPOSAL_PRESENTATION', 'CONTRACT_SIGNING', 'INSTALLATION', 'INSPECTION', 'FOLLOW_UP');
ALTER TABLE "Appointment" ALTER COLUMN "purpose" TYPE "AppointmentPurpose_new" USING ("purpose"::text::"AppointmentPurpose_new");
ALTER TYPE "AppointmentPurpose" RENAME TO "AppointmentPurpose_old";
ALTER TYPE "AppointmentPurpose_new" RENAME TO "AppointmentPurpose";
DROP TYPE "AppointmentPurpose_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentStatus_new" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW');
ALTER TABLE "Appointment" ALTER COLUMN "status" TYPE "AppointmentStatus_new" USING ("status"::text::"AppointmentStatus_new");
ALTER TYPE "AppointmentStatus" RENAME TO "AppointmentStatus_old";
ALTER TYPE "AppointmentStatus_new" RENAME TO "AppointmentStatus";
DROP TYPE "AppointmentStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_leadId_fkey";

-- DropIndex
DROP INDEX "idx_appointments_date";

-- AlterTable
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_pkey",
DROP COLUMN "date",
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIMESTAMPTZ(6) NOT NULL,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" TIMESTAMPTZ(6) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'SCHEDULED',
ALTER COLUMN "leadId" SET DATA TYPE VARCHAR,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Appointment_startTime_idx" ON "Appointment"("startTime");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_appointments_lead_id" RENAME TO "Appointment_leadId_idx";

-- RenameIndex
ALTER INDEX "idx_appointments_user_id" RENAME TO "Appointment_userId_idx";
