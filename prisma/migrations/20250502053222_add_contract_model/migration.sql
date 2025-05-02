-- CreateTable
CREATE TABLE "Contract" (
    "id" UUID NOT NULL,
    "leadId" VARCHAR(255) NOT NULL,
    "contractType" TEXT NOT NULL,
    "signatures" JSONB NOT NULL,
    "dates" JSONB NOT NULL,
    "names" JSONB NOT NULL,
    "addresses" JSONB NOT NULL,
    "contactInfo" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contract_leadId_idx" ON "Contract"("leadId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
