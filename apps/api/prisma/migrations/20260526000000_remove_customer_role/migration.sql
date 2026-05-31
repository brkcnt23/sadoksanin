-- Remove CUSTOMER from UserRole enum (B2B-only system)
-- Step 1: Verify no CUSTOMER users exist (should be 0)
DO $$
DECLARE customer_count integer;
BEGIN
  SELECT COUNT(*) INTO customer_count FROM "User" WHERE role = 'CUSTOMER';
  IF customer_count > 0 THEN
    RAISE EXCEPTION 'Cannot remove CUSTOMER role: % users still have CUSTOMER role. Run UPDATE first.', customer_count;
  END IF;
END $$;

-- Step 2: Rename old enum
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

-- Step 3: Create new enum without CUSTOMER
CREATE TYPE "UserRole" AS ENUM ('DEALER', 'ADMIN', 'SUPER_ADMIN');

-- Step 4: Alter User table to use new enum
ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN role TYPE "UserRole" USING role::text::"UserRole";
ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'DEALER'::"UserRole";

-- Step 5: Drop old enum
DROP TYPE "UserRole_old";
