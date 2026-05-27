"use client";

import { useCallback, useEffect, useReducer } from "react";
import { Board } from "@/components/sudoku/Board";
import { Timer } from "@/components/game/Timer";
import { OpponentProgress } from "@/components/game/OpponentProgress";
import type { ReplayData, ReplayMove } from "@/lib/replay";
import type { DifficultyTier } from "@/domain/puzzle";

interface RunSummary {
  id: string;
  effectiveTime: number;
  stampedElo: number;
}

interface RacePayload {
  ghostRun: { id: string; effectiveTime: number; stampedElo: number };
  puzzle: { id: string; grid: string; solution: string };
  replay: ReplayData;
}

type RacePhase =
  | "selecting"
  | "loading-runs"
  | "run-list"
  | "loading-race"
  | "playing"
  | "finished";

interface RaceState {
  phase: RacePhase;
  selectedTier: DifficultyTier;
  runs: RunSummary[];
  payload: RacePayload | null;
  board: number[];
  given: boolean[];
  mistakes: Set<number>;
  selectedCell: number | null;
  elapsedMs: number;
  startTime: number | null;
  outcome: "win" | "loss" | null;
  playerMoves: ReplayMove[];
  error: string | null;
}

type Action =
  | { type: "SELECT_TIER"; tier: DifficultyTier }
  | { type: "LOAD_RUNS_START" }
  | { type: "LOAD_RUNS_SUCCESS"; runs: RunSummary[] }
  | { type: "LOAD_RACE_START" }
  | { type: "LOAD_RACE_SUCCESS"; payload: RacePayload }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "SELECT_CELL"; index: number }
  | { type: "ENTER_VALUE"; index: number; value: number; isMistake: boolean; timestamp: number }
  | { type: "ERASE"; index: number }
  | { type: "TICK"; elapsedMs: number }
  | { type: "FINISH"; outcome: "win" | "loss" }
  | { type: "RESTART" };

function initBoard(grid: string): { board: number[]; given: boolean[] } {
  const board = grid.split("").map(Number);
  const given = board.map((v) => v !== 0);
  return { board, given };
}

function reducer(state: RaceState, action: Action): RaceState {
  switch (action.type) {
    case "SELECT_TIER":
      return { ...state, selectedTier: action.tier, runs: [], error: null };

    case "LOAD_RUNS_START":
      return { ...state, phase: "loading-runs", error: null };

    case "LOAD_RUNS_SUCCESS":
      return { ...state, phase: "run-list", runs: action.runs };

    case "LOAD_RACE_START":
      return { ...state, phase: "loading-race", error: null };

    case "LOAD_RACE_SUCCESS": {
      const { board, given } = initBoard(action.payload.puzzle.grid);
      return {
        ...state,
        phase: "playing",
        payload: action.payload,
        board,
        given,
        mistakes: new Set(),
        selectedCell: null,
        elapsedMs: 0,
        startTime: Date.now(),
        outcome: null,
        playerMoves: [],
        error: null,
      };
    }

    case "LOAD_ERROR":
      return {
        ...state,
        phase: state.runs.length > 0 ? "run-list" : "selecting",
        error: action.error,
      };

    case "SELECT_CELL":
      return { ...state, selectedCell: action.index };

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
      return { ...state, board: newBoard, mistakes: newMistakes };
    }

    case "TICK":
      return { ...state, elapsedMs: action.elapsedMs };

    case "FINISH":
      return { ...state, phase: "finished", outcome: action.outcome };

    case "RESTART":
      return { ...state, phase: "selecting", runs: [], payload: null, error: null };

    default:
      return state;
  }
}

const initialState: RaceState = {
  phase: "selecting",
  selectedTier: "easy",
  runs: [],
  payload: null,
  board: [],
  given: [],
  mistakes: new Set(),
  selectedCell: null,
  elapsedMs: 0,
  startTime: null,
  outcome: null,
  playerMoves: [],
  error: null,
};

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s}s`;
}

export function RaceScreen() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Ticker
  useEffect(() => {
    if (state.phase !== "playing" || state.startTime === null) return;
    const id = setInterval(() => {
      dispatch({ type: "TICK", elapsedMs: Date.now() - state.startTime! });
    }, 250);
    return () => clearInterval(id);
  }, [state.phase, state.startTime]);

  // Keyboard handler
  useEffect(() => {
    if (state.phase !== "playing") return;

    function handleKey(e: KeyboardEvent) {
      const { selectedCell, given, board, payload, startTime, mistakes } = state;
      if (selectedCell === null || !payload || startTime === null) return;
      if (given[selectedCell]) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        dispatch({ type: "ERASE", index: selectedCell });
        return;
      }

      const digit = parseInt(e.key);
      if (isNaN(digit) || digit < 1 || digit > 9) return;

      const correctVal = Number(payload.puzzle.solution[selectedCell]);
      const isMistake = digit !== correctVal;
      const timestamp = Date.now() - startTime;

      dispatch({ type: "ENTER_VALUE", index: selectedCell, value: digit, isMistake, timestamp });

      if (isMistake) {
        if (mistakes.size + 1 >= 3) dispatch({ type: "FINISH", outcome: "loss" });
        return;
      }

      const newBoard = [...board];
      newBoard[selectedCell] = digit;
      if (newBoard.every((v, i) => v === Number(payload.puzzle.solution[i]))) {
        const effectiveTime = timestamp + mistakes.size * 10_000;
        dispatch({
          type: "FINISH",
          outcome: effectiveTime <= payload.ghostRun.effectiveTime ? "win" : "loss",
        });
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state]);

  // Submit on finish
  useEffect(() => {
    if (state.phase !== "finished" || !state.payload) return;
    const { payload, playerMoves, elapsedMs, mistakes, outcome } = state;
    fetch("/api/race/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ghostRunId: payload.ghostRun.id,
        puzzleId: payload.puzzle.id,
        moves: playerMoves,
        effectiveTime: elapsedMs + mistakes.size * 10_000,
        solvedAt: elapsedMs,
        mistakes: mistakes.size,
        outcome,
      }),
    }).catch(() => {});
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRuns = useCallback(async (tier: DifficultyTier) => {
    dispatch({ type: "LOAD_RUNS_START" });
    try {
      const res = await fetch(`/api/race/runs?tier=${tier}`);
      if (!res.ok) throw new Error("Failed to load runs");
      const data = await res.json();
      dispatch({ type: "LOAD_RUNS_SUCCESS", runs: data.runs });
    } catch {
      dispatch({ type: "LOAD_ERROR", error: "Could not load available runs" });
    }
  }, []);

  const startRace = useCallback(async (ghostRunId: string) => {
    dispatch({ type: "LOAD_RACE_START" });
    try {
      const res = await fetch(`/api/race?ghostRunId=${ghostRunId}`);
      if (!res.ok) throw new Error("Failed to load race");
      const data = (await res.json()) as RacePayload;
      dispatch({ type: "LOAD_RACE_SUCCESS", payload: data });
    } catch {
      dispatch({ type: "LOAD_ERROR", error: "Could not load race data" });
    }
  }, []);

  const enterValue = useCallback(
    (n: number) => {
      const { selectedCell, given, board, payload, startTime, mistakes, phase } = state;
      if (phase !== "playing" || selectedCell === null || !payload || startTime === null) return;
      if (given[selectedCell]) return;
      const correctVal = Number(payload.puzzle.solution[selectedCell]);
      const isMistake = n !== correctVal;
      const timestamp = Date.now() - startTime;
      dispatch({ type: "ENTER_VALUE", index: selectedCell, value: n, isMistake, timestamp });
      if (isMistake) {
        if (mistakes.size + 1 >= 3) dispatch({ type: "FINISH", outcome: "loss" });
        return;
      }
      const newBoard = [...board];
      newBoard[selectedCell] = n;
      if (newBoard.every((v, i) => v === Number(payload.puzzle.solution[i]))) {
        const effectiveTime = timestamp + mistakes.size * 10_000;
        dispatch({
          type: "FINISH",
          outcome: effectiveTime <= payload.ghostRun.effectiveTime ? "win" : "loss",
        });
      }
    },
    [state],
  );

  const {
    phase,
    selectedTier,
    runs,
    payload,
    board,
    given,
    mistakes,
    selectedCell,
    elapsedMs,
    outcome,
    error,
  } = state;

  const totalCells = given.filter((g) => !g).length;
  const playerFilledCount = board.filter((v, i) => v !== 0 && !given[i]).length;

  // ── Tier selection ──────────────────────────────────────────────────────
  if (phase === "selecting") {
    return (
      <div className="flex flex-col items-center gap-6">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-4 py-2">
            {error}
          </p>
        )}
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-gray-600">Select difficulty</p>
          <div className="flex gap-2">
            {(["easy", "medium", "hard"] as DifficultyTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => dispatch({ type: "SELECT_TIER", tier })}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${
                  selectedTier === tier
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => loadRuns(selectedTier)}
          className="px-8 py-3 bg-orange-500 text-white rounded-xl font-semibold text-lg hover:bg-orange-600 transition-colors"
        >
          Find Opponents
        </button>
      </div>
    );
  }

  // ── Loading runs ────────────────────────────────────────────────────────
  if (phase === "loading-runs") {
    return <p className="text-gray-500">Loading available runs…</p>;
  }

  // ── Run list ────────────────────────────────────────────────────────────
  if (phase === "run-list" || phase === "loading-race") {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-4 py-2 w-full">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between w-full">
          <h2 className="font-semibold text-gray-700 capitalize">{selectedTier} opponents</h2>
          <button
            type="button"
            onClick={() => dispatch({ type: "RESTART" })}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Back
          </button>
        </div>
        {runs.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No runs available for this tier. Seed the DB first.
          </p>
        ) : (
          <ul className="w-full flex flex-col gap-2">
            {runs.map((run) => (
              <li
                key={run.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-800">ELO {run.stampedElo}</p>
                  <p className="text-sm text-gray-500">{formatTime(run.effectiveTime)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startRace(run.id)}
                  disabled={phase === "loading-race"}
                  className="px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  Race
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!payload) return null;

  // ── Finished ────────────────────────────────────────────────────────────
  if (phase === "finished") {
    const effectiveTime = elapsedMs + mistakes.size * 10_000;
    return (
      <div className="flex flex-col items-center gap-6">
        <div
          className={`text-center px-8 py-6 rounded-2xl border-2 ${outcome === "win" ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"}`}
        >
          <p className="text-3xl font-bold mb-1">
            {outcome === "win" ? "You Won! 🎉" : "You Lost"}
          </p>
          <p className="text-gray-600">Your time: {formatTime(effectiveTime)}</p>
          <p className="text-gray-600">Opponent: {formatTime(payload.ghostRun.effectiveTime)}</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "RESTART" })}
          className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Race Again
        </button>
      </div>
    );
  }

  // ── Playing ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center justify-between w-full max-w-xs">
        <Timer elapsedMs={elapsedMs} mistakeCount={mistakes.size} />
        <span className="text-xs text-gray-400 capitalize">{selectedTier}</span>
      </div>
      <Board
        board={board}
        given={given}
        mistakes={mistakes}
        selectedCell={selectedCell}
        onCellClick={(idx) => dispatch({ type: "SELECT_CELL", index: idx })}
      />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => enterValue(n)}
            className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-800 transition-colors"
          >
            {n}
          </button>
        ))}
      </div>
      <OpponentProgress
        replay={payload.replay}
        totalCells={totalCells}
        elapsedMs={elapsedMs}
        playerFilledCount={playerFilledCount}
      />
    </div>
  );
}
