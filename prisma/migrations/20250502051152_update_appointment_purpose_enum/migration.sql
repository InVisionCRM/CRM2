/*
  Warnings:

  - The values [INITIAL_ASSESSMENT,MEASUREMENT,PROPOSAL_PRESENTATION,CONTRACT_SIGNING,INSTALLATION,INSPECTION,FOLLOW_UP] on the enum `AppointmentPurpose` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentPurpose_new" AS ENUM ('ADJUSTER_APPOINTMENT', 'PICK_UP_CHECK', 'BUILD_DAY', 'MEETING_WITH_CLIENT');
ALTER TABLE "Appointment" ALTER COLUMN "purpose" TYPE "AppointmentPurpose_new" USING ("purpose"::text::"AppointmentPurpose_new");
ALTER TYPE "AppointmentPurpose" RENAME TO "AppointmentPurpose_old";
ALTER TYPE "AppointmentPurpose_new" RENAME TO "AppointmentPurpose";
DROP TYPE "AppointmentPurpose_old";
COMMIT;
