-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('WINNERS', 'LOSERS', 'GRAND_FINAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'READY', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "username" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "classYear" VARCHAR(20),
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "UserDaily" (
    "username" VARCHAR(255) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "distance" INTEGER NOT NULL DEFAULT 0,
    "played" BOOLEAN NOT NULL DEFAULT false,
    "lastPlayed" TIMESTAMP(3),
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "maxStreak" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserDaily_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Picture" (
    "id" SERIAL NOT NULL,
    "cloudinaryId" VARCHAR(512) NOT NULL,
    "imageUrl" VARCHAR(1024) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "placeName" VARCHAR(255) NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "uploadedBy" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Picture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "pictureId" INTEGER NOT NULL,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" SERIAL NOT NULL,
    "challengerId" VARCHAR(255) NOT NULL,
    "challengeeId" VARCHAR(255) NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "challengerPoints" INTEGER NOT NULL DEFAULT 0,
    "challengeePoints" INTEGER NOT NULL DEFAULT 0,
    "challengerFinished" BOOLEAN NOT NULL DEFAULT false,
    "challengeeFinished" BOOLEAN NOT NULL DEFAULT false,
    "winnerId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeRound" (
    "id" SERIAL NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "pictureId" INTEGER NOT NULL,
    "playerUsername" VARCHAR(255),
    "guessLat" DOUBLE PRECISION,
    "guessLng" DOUBLE PRECISION,
    "distance" INTEGER,
    "points" INTEGER,
    "timeSeconds" INTEGER,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "ChallengeRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'OPEN',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "timeLimit" INTEGER NOT NULL DEFAULT 120,
    "roundsPerMatch" INTEGER NOT NULL DEFAULT 5,
    "maxParticipants" INTEGER NOT NULL DEFAULT 8,
    "createdBy" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "winnerId" VARCHAR(255),

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentParticipant" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "seed" INTEGER,
    "eliminated" BOOLEAN NOT NULL DEFAULT false,
    "lossCount" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "bracketType" "BracketType" NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "player1Id" VARCHAR(255),
    "player2Id" VARCHAR(255),
    "player1Score" INTEGER,
    "player2Score" INTEGER,
    "winnerId" VARCHAR(255),
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "nextWinnerMatchId" INTEGER,
    "nextLoserMatchId" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentRound" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "pictureId" INTEGER NOT NULL,
    "playerUsername" VARCHAR(255),
    "guessLat" DOUBLE PRECISION,
    "guessLng" DOUBLE PRECISION,
    "distance" INTEGER,
    "points" INTEGER,
    "timeSeconds" INTEGER,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "TournamentRound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_totalPoints_idx" ON "User"("totalPoints" DESC);

-- CreateIndex
CREATE INDEX "Picture_difficulty_idx" ON "Picture"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_date_key" ON "DailyChallenge"("date");

-- CreateIndex
CREATE INDEX "DailyChallenge_date_idx" ON "DailyChallenge"("date");

-- CreateIndex
CREATE INDEX "Challenge_challengerId_idx" ON "Challenge"("challengerId");

-- CreateIndex
CREATE INDEX "Challenge_challengeeId_idx" ON "Challenge"("challengeeId");

-- CreateIndex
CREATE INDEX "Challenge_status_idx" ON "Challenge"("status");

-- CreateIndex
CREATE INDEX "ChallengeRound_challengeId_idx" ON "ChallengeRound"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeRound_challengeId_roundNumber_playerUsername_key" ON "ChallengeRound"("challengeId", "roundNumber", "playerUsername");

-- CreateIndex
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");

-- CreateIndex
CREATE INDEX "TournamentParticipant_tournamentId_idx" ON "TournamentParticipant"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_tournamentId_username_key" ON "TournamentParticipant"("tournamentId", "username");

-- CreateIndex
CREATE INDEX "TournamentMatch_tournamentId_idx" ON "TournamentMatch"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentMatch_status_idx" ON "TournamentMatch"("status");

-- CreateIndex
CREATE INDEX "TournamentRound_matchId_idx" ON "TournamentRound"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentRound_matchId_roundNumber_playerUsername_key" ON "TournamentRound"("matchId", "roundNumber", "playerUsername");

-- AddForeignKey
ALTER TABLE "UserDaily" ADD CONSTRAINT "UserDaily_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Picture" ADD CONSTRAINT "Picture_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_pictureId_fkey" FOREIGN KEY ("pictureId") REFERENCES "Picture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_challengeeId_fkey" FOREIGN KEY ("challengeeId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRound" ADD CONSTRAINT "ChallengeRound_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRound" ADD CONSTRAINT "ChallengeRound_pictureId_fkey" FOREIGN KEY ("pictureId") REFERENCES "Picture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRound" ADD CONSTRAINT "ChallengeRound_playerUsername_fkey" FOREIGN KEY ("playerUsername") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRound" ADD CONSTRAINT "TournamentRound_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRound" ADD CONSTRAINT "TournamentRound_pictureId_fkey" FOREIGN KEY ("pictureId") REFERENCES "Picture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRound" ADD CONSTRAINT "TournamentRound_playerUsername_fkey" FOREIGN KEY ("playerUsername") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;
