-- CreateTable
CREATE TABLE "TournamentBracketRound" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "bracketType" "BracketType" NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "pictureIndex" INTEGER NOT NULL,
    "pictureId" INTEGER NOT NULL,

    CONSTRAINT "TournamentBracketRound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentBracketRound_tournamentId_bracketType_roundNumber_idx" ON "TournamentBracketRound"("tournamentId", "bracketType", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentBracketRound_tournamentId_bracketType_roundNumber_key" ON "TournamentBracketRound"("tournamentId", "bracketType", "roundNumber", "pictureIndex");

-- AddForeignKey
ALTER TABLE "TournamentBracketRound" ADD CONSTRAINT "TournamentBracketRound_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketRound" ADD CONSTRAINT "TournamentBracketRound_pictureId_fkey" FOREIGN KEY ("pictureId") REFERENCES "Picture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
