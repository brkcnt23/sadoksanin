-- Add parentId to Category for hierarchical categories
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Category_parentId_idx" ON "Category"("parentId");
