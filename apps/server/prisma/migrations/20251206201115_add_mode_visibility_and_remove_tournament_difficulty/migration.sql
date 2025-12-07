/*
  Warnings:

  - You are about to drop the column `difficulty` on the `Tournament` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Picture" ADD COLUMN     "showInDaily" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInTournament" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInVersus" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "difficulty";
