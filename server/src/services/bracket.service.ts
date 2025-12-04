import { prisma } from '../config/database.js';
import type { Bracket, BracketMatch } from '../types/index.js';

export class BracketService {
  /**
   * Generate double elimination bracket for a tournament
   */
  async generateBracket(tournamentId: number, participants: string[]) {
    // Shuffle participants for random seeding
    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // Pad to next power of 2 for proper bracket
    const bracketSize = this.nextPowerOf2(shuffled.length);
    const byes = bracketSize - shuffled.length;

    // Seed participants (with byes getting automatic first round wins)
    const seeded: (string | null)[] = [];
    for (let i = 0; i < bracketSize; i++) {
      seeded.push(shuffled[i] || null);
    }

    // Update participant seeds in database
    for (let i = 0; i < shuffled.length; i++) {
      await prisma.tournamentParticipant.updateMany({
        where: {
          tournamentId,
          username: shuffled[i]
        },
        data: { seed: i + 1 }
      });
    }

    // Create winners bracket matches
    const winnersRounds = Math.log2(bracketSize);
    const winnersMatches: number[][] = []; // matchIds by round

    // Create all winners bracket rounds
    for (let round = 0; round < winnersRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round + 1);
      const roundMatches: number[] = [];

      for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
        const match = await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            bracketType: 'WINNERS',
            roundNumber: round + 1,
            matchNumber: matchNum + 1,
            status: round === 0 ? 'READY' : 'PENDING'
          }
        });
        roundMatches.push(match.id);
      }
      winnersMatches.push(roundMatches);
    }

    // Set up first round with players
    for (let i = 0; i < winnersMatches[0].length; i++) {
      const player1 = seeded[i * 2];
      const player2 = seeded[i * 2 + 1];

      await prisma.tournamentMatch.update({
        where: { id: winnersMatches[0][i] },
        data: {
          player1Id: player1,
          player2Id: player2,
          status: player1 && player2 ? 'READY' : 'PENDING'
        }
      });

      // If one player is null (bye), auto-advance the other
      if (!player1 && player2) {
        await prisma.tournamentMatch.update({
          where: { id: winnersMatches[0][i] },
          data: {
            winnerId: player2,
            status: 'COMPLETED'
          }
        });
      } else if (player1 && !player2) {
        await prisma.tournamentMatch.update({
          where: { id: winnersMatches[0][i] },
          data: {
            winnerId: player1,
            status: 'COMPLETED'
          }
        });
      }
    }

    // Link winners bracket matches (winner advances to next round)
    for (let round = 0; round < winnersMatches.length - 1; round++) {
      for (let matchNum = 0; matchNum < winnersMatches[round].length; matchNum++) {
        const nextMatchIndex = Math.floor(matchNum / 2);
        await prisma.tournamentMatch.update({
          where: { id: winnersMatches[round][matchNum] },
          data: {
            nextWinnerMatchId: winnersMatches[round + 1][nextMatchIndex]
          }
        });
      }
    }

    // Create losers bracket (for double elimination)
    // Losers bracket has 2 * (winnersRounds - 1) rounds
    const losersRoundsCount = 2 * (winnersRounds - 1);
    const losersMatches: number[][] = [];

    for (let round = 0; round < losersRoundsCount; round++) {
      // Losers bracket size varies by round
      let matchesInRound: number;
      if (round % 2 === 0) {
        // Drop-down rounds: same as previous winners round
        matchesInRound = bracketSize / Math.pow(2, Math.floor(round / 2) + 2);
      } else {
        // Consolidation rounds: same as previous losers round
        matchesInRound = losersMatches[round - 1]?.length || bracketSize / 4;
      }

      if (matchesInRound < 1) matchesInRound = 1;

      const roundMatches: number[] = [];
      for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
        const match = await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            bracketType: 'LOSERS',
            roundNumber: round + 1,
            matchNumber: matchNum + 1,
            status: 'PENDING'
          }
        });
        roundMatches.push(match.id);
      }
      losersMatches.push(roundMatches);
    }

    // Link losers to losers bracket from winners bracket
    for (let i = 0; i < winnersMatches[0].length; i++) {
      if (losersMatches[0]) {
        const loserMatchIndex = Math.floor(i / 2);
        if (losersMatches[0][loserMatchIndex]) {
          await prisma.tournamentMatch.update({
            where: { id: winnersMatches[0][i] },
            data: {
              nextLoserMatchId: losersMatches[0][loserMatchIndex]
            }
          });
        }
      }
    }

    // Create grand final
    const grandFinal = await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        bracketType: 'GRAND_FINAL',
        roundNumber: 1,
        matchNumber: 1,
        status: 'PENDING'
      }
    });

    // Link winners final to grand final
    if (winnersMatches.length > 0) {
      const winnersFinal = winnersMatches[winnersMatches.length - 1][0];
      await prisma.tournamentMatch.update({
        where: { id: winnersFinal },
        data: { nextWinnerMatchId: grandFinal.id }
      });
    }

    // Link losers final to grand final
    if (losersMatches.length > 0) {
      const losersFinal = losersMatches[losersMatches.length - 1][0];
      await prisma.tournamentMatch.update({
        where: { id: losersFinal },
        data: { nextWinnerMatchId: grandFinal.id }
      });
    }

    return { winnersMatches, losersMatches, grandFinalId: grandFinal.id };
  }

  /**
   * Get bracket structure for a tournament
   */
  async getBracket(tournamentId: number): Promise<Bracket> {
    const matches = await prisma.tournamentMatch.findMany({
      where: { tournamentId },
      include: {
        player1: { select: { username: true, displayName: true } },
        player2: { select: { username: true, displayName: true } }
      },
      orderBy: [{ roundNumber: 'asc' }, { matchNumber: 'asc' }]
    });

    // Organize into bracket structure
    const winners: BracketMatch[][] = [];
    const losers: BracketMatch[][] = [];
    let grandFinal: BracketMatch | null = null;

    for (const match of matches) {
      const bracketMatch: BracketMatch = {
        id: match.id,
        player1: match.player1Id,
        player1DisplayName: match.player1?.displayName || null,
        player2: match.player2Id,
        player2DisplayName: match.player2?.displayName || null,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        winnerId: match.winnerId,
        status: match.status.toLowerCase() as BracketMatch['status']
      };

      if (match.bracketType === 'WINNERS') {
        while (winners.length < match.roundNumber) {
          winners.push([]);
        }
        winners[match.roundNumber - 1].push(bracketMatch);
      } else if (match.bracketType === 'LOSERS') {
        while (losers.length < match.roundNumber) {
          losers.push([]);
        }
        losers[match.roundNumber - 1].push(bracketMatch);
      } else if (match.bracketType === 'GRAND_FINAL') {
        grandFinal = bracketMatch;
      }
    }

    return {
      winners,
      losers,
      grandFinal: grandFinal || {
        id: 0,
        player1: null,
        player1DisplayName: null,
        player2: null,
        player2DisplayName: null,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        status: 'pending'
      }
    };
  }

  /**
   * Advance winner to next match
   */
  async advanceWinner(matchId: number, winnerId: string) {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId }
    });

    if (!match) return;

    // Update current match
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        winnerId,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Advance winner to next match
    if (match.nextWinnerMatchId) {
      const nextMatch = await prisma.tournamentMatch.findUnique({
        where: { id: match.nextWinnerMatchId }
      });

      if (nextMatch) {
        // Determine which slot to fill
        const updateData = !nextMatch.player1Id
          ? { player1Id: winnerId }
          : { player2Id: winnerId };

        await prisma.tournamentMatch.update({
          where: { id: match.nextWinnerMatchId },
          data: {
            ...updateData,
            status: nextMatch.player1Id || nextMatch.player2Id ? 'READY' : 'PENDING'
          }
        });
      }
    }

    // Send loser to losers bracket (if in winners bracket)
    if (match.bracketType === 'WINNERS' && match.nextLoserMatchId) {
      const loserId =
        match.player1Id === winnerId ? match.player2Id : match.player1Id;

      if (loserId) {
        const loserMatch = await prisma.tournamentMatch.findUnique({
          where: { id: match.nextLoserMatchId }
        });

        if (loserMatch) {
          const updateData = !loserMatch.player1Id
            ? { player1Id: loserId }
            : { player2Id: loserId };

          await prisma.tournamentMatch.update({
            where: { id: match.nextLoserMatchId },
            data: {
              ...updateData,
              status: loserMatch.player1Id || loserMatch.player2Id ? 'READY' : 'PENDING'
            }
          });
        }

        // Update participant loss count
        await prisma.tournamentParticipant.updateMany({
          where: {
            tournamentId: match.tournamentId,
            username: loserId
          },
          data: { lossCount: { increment: 1 } }
        });
      }
    }

    // If loser in losers bracket, they're eliminated
    if (match.bracketType === 'LOSERS') {
      const loserId =
        match.player1Id === winnerId ? match.player2Id : match.player1Id;

      if (loserId) {
        await prisma.tournamentParticipant.updateMany({
          where: {
            tournamentId: match.tournamentId,
            username: loserId
          },
          data: {
            eliminated: true,
            lossCount: 2
          }
        });
      }
    }

    // Check if tournament is complete (grand final finished)
    if (match.bracketType === 'GRAND_FINAL') {
      await prisma.tournament.update({
        where: { id: match.tournamentId },
        data: {
          status: 'COMPLETED',
          winnerId,
          completedAt: new Date()
        }
      });
    }
  }

  private nextPowerOf2(n: number): number {
    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }
}
