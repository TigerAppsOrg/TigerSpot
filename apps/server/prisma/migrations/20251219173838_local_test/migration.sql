-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "forfeitedBy" VARCHAR(255);

-- AlterTable
ALTER TABLE "ChallengeRound" ADD COLUMN     "startedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Picture" ADD COLUMN     "usedInDaily" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "timeLimit" SET DEFAULT 30;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeenVersus" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserDaily" ADD COLUMN     "startedAt" TIMESTAMP(3);
