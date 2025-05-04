/*
  Warnings:

  - You are about to drop the column `city` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `streetAddress` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `zipcode` on the `Lead` table. All the data in the column will be lost.
  - You are about to alter the column `address` on the `Lead` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(510)`.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "city",
DROP COLUMN "state",
DROP COLUMN "streetAddress",
DROP COLUMN "zipcode",
ALTER COLUMN "address" SET DATA TYPE VARCHAR(510);
