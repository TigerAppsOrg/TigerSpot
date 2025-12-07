-- Add joinCode column to Tournament table
-- First add as nullable
ALTER TABLE "Tournament" ADD COLUMN "joinCode" VARCHAR(8);

-- Generate unique codes for existing tournaments
-- Using a combination of random characters
UPDATE "Tournament"
SET "joinCode" = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 6))
WHERE "joinCode" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "Tournament" ALTER COLUMN "joinCode" SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX "Tournament_joinCode_key" ON "Tournament"("joinCode");
