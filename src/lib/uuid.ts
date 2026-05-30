import { randomUUID } from "node:crypto";

/** Date-prefixed UUIDv4: lexicographically sortable by day, unique within a day. */
export function replayKey(solvedAt: number): string {
  const date = new Date(solvedAt).toISOString().slice(0, 10);
  return `${date}_${randomUUID()}`;
}
