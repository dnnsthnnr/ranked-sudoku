# ADR 001: Replay Timestamps and Effective Time

**Status:** Accepted

---

## Context

Each game records a move log (`ReplayMove[]`) as the player fills in cells. Each
move carries a `timestamp` (milliseconds elapsed since puzzle start) and an
`isMistake` flag. When a player makes a mistake, a 10-second penalty is added to
their *effective* time, which is what counts for ranking and ghost comparison.

Before this ADR the penalty constant (`10_000`) was scattered as a magic literal
across game screens, the seed script, and the lead-bar computation. This made the
penalty value hard to change, and led to a subtle bug: the lead bar compared the
ghost's raw timestamps against the player's *effective* elapsed time, causing the
bar to misrepresent who was winning.

---

## Decision

**Move logs always store raw timestamps.**

`ReplayMove.timestamp` is always the raw wall-clock milliseconds elapsed since the
puzzle started. Penalties are never baked into individual move timestamps.

**Effective time is always derived at query time.**

When a player (or ghost) has made `k` mistakes, their effective elapsed time at raw
timestamp `t` is:

```
effectiveTime(t, k) = t + k × MISTAKE_PENALTY_MS
```

For ghost replay, each ghost mistake shifts all *subsequent* ghost effective
timestamps forward by `MISTAKE_PENALTY_MS`, mirroring how a live player's effective
clock jumps on each mistake.

**Single source of truth.**

`MISTAKE_PENALTY_MS` is defined only in `src/lib/replay.ts`. All other modules
import it from there; none perform penalty arithmetic independently.

---

## Implementation

### `MISTAKE_PENALTY_MS` (in `src/lib/replay.ts`)

```typescript
export const MISTAKE_PENALTY_MS = 10_000;
```

Changing this one value adjusts the penalty everywhere: lead bar, win/loss
conditions, finish-screen display, ghost comparison, and the seed script.

### `countGhostFillsAt(moves, playerEffectiveMs)`

Returns how many correct cells the ghost has filled by the time the *player's*
effective clock reaches `playerEffectiveMs`. Ghost moves are processed in a single
forward pass; each ghost mistake increments the ghost's own penalty accumulator,
shifting subsequent effective timestamps up by `MISTAKE_PENALTY_MS`.

Because raw timestamps are strictly increasing, and each penalty only pushes
subsequent effective timestamps higher, the effective timestamp sequence is
monotonically increasing — so the loop can exit early on the first move that
exceeds `playerEffectiveMs`.

```typescript
export function countGhostFillsAt(moves: ReplayMove[], playerEffectiveMs: number): number {
  let ghostMistakes = 0;
  let filled = 0;
  for (const move of moves) {
    const effectiveTs = move.timestamp + ghostMistakes * MISTAKE_PENALTY_MS;
    if (effectiveTs > playerEffectiveMs) break;
    if (move.isMistake) {
      ghostMistakes++;
    } else {
      filled++;
    }
  }
  return filled;
}
```

### `computeEffectiveTime(moves)`

Derives the canonical effective time for a completed run from its move log alone.
Used when submitting a player's result — no more `elapsedMs + mistakeCount * N`
in game screens.

```typescript
export function computeEffectiveTime(moves: ReplayMove[]): number {
  const mistakes = moves.filter((m) => m.isMistake).length;
  const lastCorrect = [...moves].findLast((m) => !m.isMistake);
  return (lastCorrect?.timestamp ?? 0) + mistakes * MISTAKE_PENALTY_MS;
}
```

---

## Consequences

**Positive**

- Changing `MISTAKE_PENALTY_MS` requires editing one line in one file.
- `countGhostFillsAt` correctly compares ghost effective time against player
  effective time, fixing the lead bar.
- `computeEffectiveTime` eliminates `mistakeCount * 10_000` literals in callers.
- The move log is the ground truth; the `effectiveTime` stored in the DB is derived
  from it, not the other way around.

**Neutral**

- Callers that need the player's effective elapsed time (e.g. the lead bar, the
  auto-loss check) still compute `elapsedMs + mistakeCount * MISTAKE_PENALTY_MS`
  locally — but they import the constant rather than hard-coding a number.

**Negative**

- None identified.
