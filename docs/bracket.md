# Bracket System

This document explains how the double elimination bracket system works in TigerSpot tournaments.

## Overview

TigerSpot uses a **double elimination** bracket format. Players must lose twice to be eliminated. The bracket consists of:

- **Winners Bracket**: Players who haven't lost yet
- **Losers Bracket**: Players who have lost once (getting a second chance)
- **Grand Final**: Winners bracket champion vs losers bracket champion

## Bracket Generation

When a tournament starts, `BracketService.generateBracket()` creates the entire bracket structure.

### 1. Seeding

```
Participants are shuffled randomly, then placed using standard bracket seeding:
- For 8 players: 1v8, 4v5, 3v6, 2v7
- This ensures top seeds meet late in the bracket
- Byes (empty slots) go to top seeds so they auto-advance
```

### 2. Bracket Size

The bracket is padded to the next power of 2:
- 5-8 players → 8-slot bracket
- 9-16 players → 16-slot bracket
- etc.

Empty slots become **byes** (automatic wins for the opponent).

### 3. Match Structure

Each match has:
- `player1Id`, `player2Id`: The two competitors
- `winnerId`: Set when match completes
- `nextWinnerMatchId`: Where the winner advances to
- `nextLoserMatchId`: Where the loser drops to (winners bracket only)
- `status`: PENDING, READY, or COMPLETED

## Winners Bracket

```
Round 1        Round 2        Finals
┌───────┐
│ P1    │──┐
└───────┘  │  ┌───────┐
           ├──│       │──┐
┌───────┐  │  └───────┘  │
│ P8    │──┘             │  ┌───────┐
└───────┘                ├──│       │──→ Grand Final
┌───────┐                │  └───────┘
│ P4    │──┐             │
└───────┘  │  ┌───────┐  │
           ├──│       │──┘
┌───────┐  │  └───────┘
│ P5    │──┘
└───────┘
```

- Winners advance via `nextWinnerMatchId`
- Losers drop to losers bracket via `nextLoserMatchId`

## Losers Bracket

The losers bracket has **two types of rounds**:

1. **Drop rounds** (even indices: 0, 2, 4...): Receive fresh losers from winners bracket
2. **Cross rounds** (odd indices: 1, 3, 5...): Losers bracket survivors face winners bracket dropouts

### Round Structure (8-player example)

```
LR1 (Drop)     LR2 (Cross)    LR3 (Consol)   LR4 (Final)
┌───────┐
│WR1 L  │──┐
└───────┘  │  ┌───────┐
           ├──│       │──┐
┌───────┐  │  │+ WR2 L│  │
│WR1 L  │──┘  └───────┘  │  ┌───────┐
└───────┘                ├──│       │──┐
┌───────┐                │  └───────┘  │  ┌───────┐
│WR1 L  │──┐  ┌───────┐  │             ├──│       │──→ Grand Final
└───────┘  │  │       │──┘             │  │+ WR F │
           ├──│+ WR2 L│                │  └───────┘
┌───────┐  │  └───────┘                │
│WR1 L  │──┘                           │
└───────┘     (LR1 winners meet        │
              WR2 losers here)    ─────┘
```

### Linking Logic

```javascript
// Winners Round n → Losers Round index
WR1 (index 0) → LR index 0  (drop round)
WR2 (index 1) → LR index 1  (cross round, 2*1-1=1)
WR3 (index 2) → LR index 3  (cross round, 2*2-1=3)
WRn (index n) → LR index 2n-1  (for n >= 1)
```

## Handling Byes

Byes create special cases in the losers bracket since bye matches have no loser to send.

### During Generation

1. Bye matches in WR1 are auto-completed (winner advances, no loser)
2. For each LR1 match, we check its two WR1 feeder matches:
   - **Both feeders are byes**: LR match marked COMPLETED (no players)
   - **One feeder is bye**: Handled dynamically when the real loser arrives

### During Progression

When a loser arrives at an LR match, `checkAndAutoAdvanceLoserMatch()` runs:

1. Checks if all feeder matches are completed
2. If the LR match has exactly 1 player → auto-advance them
3. If it has 0 players → mark completed and propagate

This cascades through the bracket, handling complex bye scenarios.

## Match Progression

### `advanceWinner(matchId, winnerId)`

Called when a match completes:

1. **Update current match**: Set `winnerId`, status to COMPLETED
2. **Advance winner**: Place in next match via `nextWinnerMatchId`
3. **Handle loser** (winners bracket only):
   - Send to losers bracket via `nextLoserMatchId`
   - Increment loss count
   - Check for auto-advancement if other feeder was a bye
4. **Eliminate loser** (losers bracket): Mark as eliminated (2 losses)
5. **Complete tournament** (grand final): Set tournament winner

### Match Status Flow

```
PENDING → READY → COMPLETED
   │         │
   │         └── Both players assigned, can be played
   └── Waiting for players from previous matches
```

## Grand Final

The grand final receives:
- Winner from winners bracket final (0 losses)
- Winner from losers bracket final (1 loss)

When the grand final completes, the tournament status is set to COMPLETED and the winner is recorded.

## Database Schema

Key fields in `TournamentMatch`:

| Field | Description |
|-------|-------------|
| `bracketType` | WINNERS, LOSERS, or GRAND_FINAL |
| `roundNumber` | Round within the bracket type (1-indexed) |
| `matchNumber` | Match position within the round (1-indexed) |
| `nextWinnerMatchId` | FK to next match for winner |
| `nextLoserMatchId` | FK to losers bracket match (winners only) |

## Example: 7-Player Tournament

With 7 players in an 8-slot bracket (1 bye):

```
Winners R1:
  Match 1: Player A vs Player B  → loser to LR1-1
  Match 2: Player C vs (bye)     → C advances, NO loser
  Match 3: Player D vs Player E  → loser to LR1-2
  Match 4: Player F vs Player G  → loser to LR1-2

Losers R1:
  LR1-1: Receives 1 loser (from Match 1) + 0 (Match 2 was bye)
         → Auto-advances the single player
  LR1-2: Receives 2 losers (from Match 3 & 4)
         → Normal match
```

The bye handling ensures the bracket progresses correctly without empty matches blocking advancement.
