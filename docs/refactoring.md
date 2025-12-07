# TigerSpot Refactoring Plan

## Overview

Analysis of `server/` and `tigerspot-new/` reveals well-structured code with clear separation of concerns, but significant opportunities for reducing duplication and improving maintainability.

**Estimated duplicate/redundant code: ~1,500-2,000 lines across both directories**

---

## High Priority Refactorings

### 1. Extract Shared Game Play Component (Frontend)

**Impact: Eliminates ~400+ lines of duplication**

The tournament play (`tournament/play/[matchId]/+page.svelte` - 493 lines) and versus play (`versus/play/[challengeId]/+page.svelte` - 425 lines) pages are ~95% identical.

**Create:** `src/lib/components/GamePlayBoard.svelte`

- Timer management
- Round submission logic
- Map guess handling
- Opponent waiting states
- "No guess" timeout handling

**Files to refactor:**

- `tigerspot-new/src/routes/tournament/play/[matchId]/+page.svelte`
- `tigerspot-new/src/routes/versus/play/[challengeId]/+page.svelte`

---

### 2. Create Parameter Validation Utility (Backend)

**Impact: Eliminates ~28 repeated validation blocks**

The pattern `parseInt(req.params.id, 10) + isNaN check` repeats 28+ times across controllers.

**Create:** `server/src/utils/validation.ts`

```typescript
export function parseIntParam(req: Request, paramName: string, errorMessage: string): number | null;
// OR create validation middleware
```

**Files to refactor:**

- `server/src/controllers/tournament.controller.ts` (13+ occurrences)
- `server/src/controllers/versus.controller.ts` (10+ occurrences)
- `server/src/controllers/admin.controller.ts` (5+ occurrences)

---

### 3. Centralize Constants (Backend)

**Impact: Improves maintainability, eliminates scattered magic numbers**

Magic numbers are scattered across services:

- `ROUNDS_PER_MATCH = 5` (versus.service.ts:6)
- `PRESENCE_TIMEOUT_SECONDS = 30` (versus.service.ts:7)
- `CHALLENGE_EXPIRY_MINUTES = 2` (versus.service.ts:8)
- `GRACE_PERIOD_SECONDS = 5` (tournament.service.ts:401 - buried in method)
- `timeLimit: number = 120` (daily.service.ts:116 - hardcoded default)

**Create:** `server/src/config/constants.ts`

---

### 4. Create Polling Utility (Frontend)

**Impact: Eliminates ~150 lines, standardizes behavior**

5+ files implement polling patterns with slight variations.

**Create:** `src/lib/utils/usePolling.ts`

**Files to refactor:**

- `tigerspot-new/src/routes/versus/+page.svelte`
- `tigerspot-new/src/routes/tournament/[id]/waiting/+page.svelte`
- `tigerspot-new/src/routes/tournament/play/[matchId]/+page.svelte`
- `tigerspot-new/src/routes/versus/play/[challengeId]/+page.svelte`

---

## Medium Priority Refactorings

### 5. Extract Round Results Display Component (Frontend)

**Impact: Eliminates ~150-200 lines**

Tournament results (594 lines) and versus results (437 lines) share ~70% identical round review UI.

**Create:** `src/lib/components/RoundResults.svelte`

**Files to refactor:**

- `tigerspot-new/src/routes/tournament/results/[matchId]/+page.svelte`
- `tigerspot-new/src/routes/versus/results/[challengeId]/+page.svelte`

---

### 6. Extract Date Utilities (Backend)

**Impact: Removes repetitive date reset logic**

Same date calculation appears 6+ times:

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);
```

**Create:** `server/src/utils/dates.ts`

- `getTodayAtMidnight()`
- `getYesterdayAtMidnight()`
- `isSameDay(date1, date2)`

**Files to refactor:**

- `server/src/services/daily.service.ts` (lines 10-11, 136-137, 176-178, 287-288)
- `server/src/controllers/leaderboard.controller.ts` (lines 11-12, 134-135)

---

### 7. Consolidate Error Handling (Backend)

**Impact: Standardizes 63 error handling blocks**

Every endpoint has:

```typescript
} catch (error) {
    console.error('Error getting X:', error);
    res.status(500).json({ error: 'Failed to get X' });
}
```

**Create:**

- `server/src/middleware/errorHandler.ts`
- Custom error classes for different HTTP status codes

---

### 8. Standardize Store Patterns (Frontend)

**Impact: Improves consistency and predictability**

Current inconsistency:

- `UserStore`: Class-based with Svelte 5 runes
- `ThemeStore`: Factory function returning object
- `GameResults`: Simple writable

**Recommendation:** Standardize on class-based pattern

---

## Lower Priority Refactorings

### 9. Split Large Service Classes (Backend)

**Impact: Improves testability and single responsibility**

`versus.service.ts` is 776 lines with 15+ methods. Consider splitting into:

- `ChallengeService` - challenge lifecycle
- `RoundService` - scoring/round logic
- `PresenceService` - heartbeat/online status

`daily.service.ts` (412 lines) has complex picture selection logic (lines 51-108) with 4 fallback levels.

---

### 10. Add Request Validation Layer (Backend)

**Impact: Removes manual validation from controllers**

Consider adding Zod or Joi for schema-based validation.

---

### 11. Create Result State Derivation Utility (Frontend)

**Impact: Consolidates winner/emoji/text logic**

Both result pages have similar derived state:

```typescript
const isWinner = $derived(results ? results.winnerId === results.you.username : false);
const usedTiebreaker = $derived(results?.tiebreaker === 'time');
const resultEmoji = $derived.by(() => { /* similar logic */ });
```

**Create:** `src/lib/utils/resultFormatting.ts`

---

### 12. Optimize Database Queries (Backend)

**Impact: Performance improvement**

`versus.service.ts` (lines 685-696) filters/sorts arrays in JavaScript that could be done at DB level.

---

## Summary Table

| Priority | Refactoring                  | Est. Lines Saved | Files Affected  |
| -------- | ---------------------------- | ---------------- | --------------- |
| HIGH     | Shared Game Play Component   | 400+             | 2 frontend      |
| HIGH     | Parameter Validation Utility | 200+             | 3 backend       |
| HIGH     | Centralize Constants         | -                | 5 backend       |
| HIGH     | Polling Utility              | 150+             | 4 frontend      |
| MED      | Round Results Component      | 150-200          | 2 frontend      |
| MED      | Date Utilities               | 50+              | 2 backend       |
| MED      | Error Handling Middleware    | -                | All controllers |
| MED      | Standardize Stores           | -                | 3 frontend      |
| LOW      | Split Large Services         | -                | 2 backend       |
| LOW      | Request Validation Layer     | -                | All controllers |
| LOW      | Result Formatting Utility    | 50+              | 2 frontend      |
| LOW      | Database Query Optimization  | -                | 1 backend       |

---

## Architecture Strengths (Keep These)

- Clear separation: controllers/services/routes/middleware
- Centralized API client with consistent error structure
- Good use of Svelte 5 runes and TypeScript
- Distance calculations properly extracted to utilities
- Prisma ORM usage is consistent
