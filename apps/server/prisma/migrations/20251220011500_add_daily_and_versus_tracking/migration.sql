-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "forfeitedBy" VARCHAR(255);

-- AlterTable
ALTER TABLE "ChallengeRound" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Picture" ADD COLUMN IF NOT EXISTS "usedInDaily" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "timeLimit" SET DEFAULT 30;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenVersus" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserDaily" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
