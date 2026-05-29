import { describe, it, expect } from "vitest";
import { uuidv5, replayKey } from "@/lib/uuid";

describe("uuidv5", () => {
  it("returns a valid UUID format", () => {
    const id = uuidv5("test");
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("is deterministic — same input always produces same UUID", () => {
    expect(uuidv5("hello")).toBe(uuidv5("hello"));
  });

  it("produces different UUIDs for different inputs", () => {
    expect(uuidv5("foo")).not.toBe(uuidv5("bar"));
  });

  it("sets version bits to 5", () => {
    const id = uuidv5("anything");
    expect(id[14]).toBe("5");
  });

  it("sets variant bits correctly (8, 9, a, or b after third dash)", () => {
    const id = uuidv5("anything");
    const variantChar = id.split("-")[3][0];
    expect(["8", "9", "a", "b"]).toContain(variantChar);
  });
});

describe("replayKey", () => {
  it("is deterministic for same puzzle/player/time", () => {
    expect(replayKey("p1", "u1", 12345)).toBe(replayKey("p1", "u1", 12345));
  });

  it("differs when any input changes", () => {
    const base = replayKey("p1", "u1", 12345);
    expect(replayKey("p2", "u1", 12345)).not.toBe(base);
    expect(replayKey("p1", "u2", 12345)).not.toBe(base);
    expect(replayKey("p1", "u1", 99999)).not.toBe(base);
  });

  it("same player solving different puzzles at same time get different keys", () => {
    expect(replayKey("puzzle-a", "player-1", 1000)).not.toBe(
      replayKey("puzzle-b", "player-1", 1000),
    );
  });
});
