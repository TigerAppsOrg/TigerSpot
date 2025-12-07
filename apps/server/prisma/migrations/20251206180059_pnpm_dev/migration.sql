-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "maxParticipants" DROP NOT NULL,
ALTER COLUMN "maxParticipants" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserDaily" ADD COLUMN     "guessLat" DOUBLE PRECISION,
ADD COLUMN     "guessLng" DOUBLE PRECISION;
