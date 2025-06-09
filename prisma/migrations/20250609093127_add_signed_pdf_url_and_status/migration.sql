-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "signedPdfUrl" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';
