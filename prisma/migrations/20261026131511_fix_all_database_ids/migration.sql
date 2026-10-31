-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "MetalRate" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
