-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "MetalRateHistory" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "metal" "MetalType" NOT NULL,
    "karat" INTEGER NOT NULL,
    "oldPricePerTola" DECIMAL(14,2),
    "newPricePerTola" DECIMAL(14,2) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetalRateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetalRateHistory_metal_karat_changedAt_idx" ON "MetalRateHistory"("metal", "karat", "changedAt");
