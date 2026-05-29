"use client";

import { useCallback, useEffect, useReducer } from "react";
import { Board } from "@/components/sudoku/Board";
import { Timer } from "@/components/game/Timer";
import { computeEffectiveTime, MISTAKE_PENALTY_MS, type ReplayMove } from "@/lib/replay";
import type { DifficultyTier } from "@/domain/puzzle";

interface DailyPuzzle {
  id: string;
  grid: string;
  solution: string;
}

type GamePhase = "idle" | "loading" | "playing" | "finished";

interface GameState {
  phase: GamePhase;
  puzzle: DailyPuzzle | null;
  tier: DifficultyTier | null;
  board: number[];
  given: boolean[];
  mistakes: Set<number>;
  mistakeCount: number;
  selectedCell: number | null;
  selectedValue: number | null;
  elapsedMs: number;
  startTime: number | null;
  pausedAt: number | null;
  playerMoves: ReplayMove[];
  error: string | null;
}

type Action =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; puzzle: DailyPuzzle; tier: DifficultyTier }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "SELECT_CELL"; index: number }
  | { type: "SELECT_VALUE"; value: number }
  | { type: "ENTER_VALUE"; index: number; value: number; isMistake: boolean; timestamp: number }
  | { type: "ERASE"; index: number }
  | { type: "TICK"; elapsedMs: number }
  | { type: "FINISH" }
  | { type: "RESTART" }
  | { type: "PAUSE" }
  | { type: "RESUME" };

function initBoard(grid: string): { board: number[]; given: boolean[] } {
  const board = grid.split("").map(Number);
  const given = board.map((v) => v !== 0);
  return { board, given };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, phase: "loading", error: null };

    case "LOAD_SUCCESS": {
      const { board, given } = initBoard(action.puzzle.grid);
      return {
        ...state,
        phase: "playing",
        puzzle: action.puzzle,
        tier: action.tier,
        board,
        given,
        mistakes: new Set(),
        mistakeCount: 0,
        selectedCell: null,
        selectedValue: null,
        elapsedMs: 0,
        startTime: Date.now(),
        playerMoves: [],
        error: null,
      };
    }

    case "LOAD_ERROR":
      return { ...state, phase: "idle", error: action.error };

    case "SELECT_CELL": {
      const cellValue = state.board[action.index];
      return {
        ...state,
        selectedCell: action.index,
        selectedValue: cellValue !== 0 ? cellValue : state.selectedValue,
      };
    }

    case "SELECT_VALUE":
      return { ...state, selectedValue: action.value };

    case "ENTER_VALUE": {
      const newBoard = [...state.board];
      newBoard[action.index] = action.value;
      const newMistakes = new Set(state.mistakes);
      if (action.isMistake) {
        newMistakes.add(action.index);
      } else {
        newMistakes.delete(action.index);
      }
      return {
        ...state,
        board: newBoard,
        mistakes: newMistakes,
        mistakeCount: state.mistakeCount + (action.isMistake ? 1 : 0),
        selectedValue: action.value,
        playerMoves: [
          ...state.playerMoves,
          {
            cellIndex: action.index,
            value: action.value,
            timestamp: action.timestamp,
            isMistake: action.isMistake,
          },
        ],
      };
    }

    case "ERASE": {
      if (state.given[action.index]) return state;
      const newBoard = [...state.board];
      newBoard[action.index] = 0;
      const newMistakes = new Set(state.mistakes);
      newMistakes.delete(action.index);
      return { ...state, board: newBoard, mistakes: newMistakes, selectedValue: null };
    }

    case "TICK":
      return { ...state, elapsedMs: action.elapsedMs };

    case "FINISH":
      return { ...state, phase: "finished" };

    case "RESTART":
      return { ...state, phase: "idle", puzzle: null, tier: null, error: null };

    case "PAUSE":
      if (state.phase !== "playing" || state.pausedAt !== null) return state;
      return { ...state, pausedAt: Date.now() };

    case "RESUME": {
      if (state.pausedAt === null || state.startTime === null) return state;
      const pauseDuration = Date.now() - state.pausedAt;
      return { ...state, pausedAt: null, startTime: state.startTime + pauseDuration };
    }

    default:
      return state;
  }
}

const initialState: GameState = {
  phase: "idle",
  puzzle: null,
  tier: null,
  board: [],
  given: [],
  mistakes: new Set(),
  mistakeCount: 0,
  selectedCell: null,
  selectedValue: null,
  elapsedMs: 0,
  startTime: null,
  pausedAt: null,
  playerMoves: [],
  error: null,
};

export function DailyGameScreen() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Ticker
  useEffect(() => {
    if (state.phase !== "playing" || state.startTime === null || state.pausedAt !== null) return;
    const id = setInterval(() => {
      dispatch({ type: "TICK", elapsedMs: Date.now() - state.startTime! });
    }, 250);
    return () => clearInterval(id);
  }, [state.phase, state.startTime, state.pausedAt]);

  // Pause/resume on tab visibility
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        dispatch({ type: "PAUSE" });
      } else {
        dispatch({ type: "RESUME" });
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Keyboard handler
  useEffect(() => {
    if (state.phase !== "playing") return;

    function handleKey(e: KeyboardEvent) {
      const { selectedCell, given, board, puzzle, startTime, mistakeCount } = state;
      if (selectedCell === null || !puzzle || startTime === null) return;
      if (given[selectedCell]) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        dispatch({ type: "ERASE", index: selectedCell });
        return;
      }

      const digit = parseInt(e.key);
      if (isNaN(digit) || digit < 1 || digit > 9) return;

      const correctVal = Number(puzzle.solution[selectedCell]);
      const isMistake = digit !== correctVal;
      const timestamp = Date.now() - startTime;

      dispatch({ type: "ENTER_VALUE", index: selectedCell, value: digit, isMistake, timestamp });

      if (isMistake) {
        if (mistakeCount + 1 >= 3) dispatch({ type: "FINISH" });
        return;
      }

      const newBoard = [...board];
      newBoard[selectedCell] = digit;
      if (newBoard.every((v, i) => v === Number(puzzle.solution[i]))) dispatch({ type: "FINISH" });
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state]);

  // Submit replay on finish
  useEffect(() => {
    if (state.phase !== "finished" || !state.puzzle) return;
    const { puzzle, playerMoves, elapsedMs, mistakeCount } = state;
    fetch("/api/daily/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puzzleId: puzzle.id,
        moves: playerMoves,
        effectiveTime: computeEffectiveTime(playerMoves),
        solvedAt: elapsedMs,
        mistakes: mistakeCount,
      }),
    }).catch(() => {});
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGame = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const date = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/daily?date=${date}`);
      if (!res.ok) {
        const err = await res.json();
        dispatch({ type: "LOAD_ERROR", error: err.error ?? "Failed to load puzzle" });
        return;
      }
      const data = await res.json();
      dispatch({ type: "LOAD_SUCCESS", puzzle: data.puzzle, tier: data.tier });
    } catch {
      dispatch({ type: "LOAD_ERROR", error: "Network error — is the dev server running?" });
    }
  }, []);

  const enterValue = useCallback(
    (n: number) => {
      const { selectedCell, given, board, puzzle, startTime, mistakeCount, phase } = state;
      if (phase !== "playing" || selectedCell === null || !puzzle || startTime === null) return;
      if (given[selectedCell]) return;
      const correctVal = Number(puzzle.solution[selectedCell]);
      const isMistake = n !== correctVal;
      const timestamp = Date.now() - startTime;
      dispatch({ type: "ENTER_VALUE", index: selectedCell, value: n, isMistake, timestamp });
      if (isMistake) {
        if (mistakeCount + 1 >= 3) dispatch({ type: "FINISH" });
        return;
      }
      const newBoard = [...board];
      newBoard[selectedCell] = n;
      if (newBoard.every((v, i) => v === Number(puzzle.solution[i]))) dispatch({ type: "FINISH" });
    },
    [state],
  );

  const {
    phase,
    tier,
    puzzle,
    board,
    given,
    mistakes,
    mistakeCount,
    selectedCell,
    selectedValue,
    elapsedMs,
    pausedAt,
    error,
  } = state;

  // ── Idle / Loading ───────────────────────────────────────────────────────
  if (phase === "idle" || phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-6">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-4 py-2">
            {error}
          </p>
        )}
        <p className="text-gray-500 text-sm">Today&apos;s difficulty is assigned automatically.</p>
        <button
          type="button"
          onClick={startGame}
          disabled={phase === "loading"}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {phase === "loading" ? "Loading…" : "Play Today's Puzzle"}
        </button>
      </div>
    );
  }

  if (!puzzle) return null;

  // ── Finished ─────────────────────────────────────────────────────────────
  if (phase === "finished") {
    const effectiveTime = computeEffectiveTime(state.playerMoves);
    const m = Math.floor(effectiveTime / 60000);
    const s = Math.round((effectiveTime % 60000) / 1000);
    const forfeited = mistakeCount >= 3;
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="text-center px-8 py-6 rounded-2xl border-2 bg-gray-50 border-gray-300">
          <p className="text-3xl font-bold mb-2">
            {forfeited ? "Too many mistakes" : "Puzzle Complete!"}
          </p>
          {!forfeited && (
            <p className="text-gray-600 text-lg">
              Your time: {m}m {s}s
            </p>
          )}
          {mistakeCount > 0 && (
            <p className="text-red-600 text-sm mt-1">
              {mistakeCount} mistake(s) — +{(mistakeCount * MISTAKE_PENALTY_MS) / 1000}s penalty
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "RESTART" })}
          className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  const completedNumbers = new Set<number>();
  for (let n = 1; n <= 9; n++) {
    if (board.filter((v, i) => v === n && !mistakes.has(i)).length === 9) completedNumbers.add(n);
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center justify-between w-full max-w-xs">
        <Timer elapsedMs={elapsedMs} mistakeCount={mistakeCount} />
        {tier && <span className="text-xs text-gray-400 capitalize">{tier}</span>}
      </div>
      <div className="relative">
        <Board
          board={board}
          given={given}
          mistakes={mistakes}
          selectedCell={selectedCell}
          selectedValue={selectedValue}
          onCellClick={(idx) => dispatch({ type: "SELECT_CELL", index: idx })}
        />
        {pausedAt !== null && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm bg-white/40">
            <p className="text-gray-700 font-semibold text-sm">Paused</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const isComplete = completedNumbers.has(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => {
                dispatch({ type: "SELECT_VALUE", value: n });
                enterValue(n);
              }}
              disabled={isComplete}
              className={`w-9 h-9 rounded-lg font-semibold transition-colors ${
                isComplete
                  ? "bg-gray-100 text-gray-400 opacity-30 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
