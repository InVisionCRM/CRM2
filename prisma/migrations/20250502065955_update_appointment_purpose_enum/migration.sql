/*
  Warnings:

  - The values [ADJUSTER_APPOINTMENT,PICK_UP_CHECK,BUILD_DAY,MEETING_WITH_CLIENT] on the enum `AppointmentPurpose` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentPurpose_new" AS ENUM ('INITIAL_CONSULTATION', 'ESTIMATE', 'FOLLOW_UP', 'INSPECTION', 'CONTRACT_SIGNING', 'OTHER');
ALTER TABLE "Appointment" ALTER COLUMN "purpose" TYPE "AppointmentPurpose_new" USING ("purpose"::text::"AppointmentPurpose_new");
ALTER TYPE "AppointmentPurpose" RENAME TO "AppointmentPurpose_old";
ALTER TYPE "AppointmentPurpose_new" RENAME TO "AppointmentPurpose";
DROP TYPE "AppointmentPurpose_old";
COMMIT;
