import { createHash } from "node:crypto";

// Fixed namespace for replay keys (randomly generated, stable for this app)
const REPLAY_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // UUID DNS namespace

function namespaceToBytes(ns: string): Uint8Array {
  const hex = ns.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

export function uuidv5(name: string): string {
  const nsBytes = namespaceToBytes(REPLAY_NAMESPACE);
  const nameBytes = Buffer.from(name, "utf8");

  const combined = Buffer.concat([nsBytes, nameBytes]);
  const hash = createHash("sha1").update(combined).digest();

  const bytes = new Uint8Array(hash.buffer, hash.byteOffset, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122

  return bytesToUuid(bytes);
}

/** Deterministic replay key: same puzzle + player + solve time → same key */
export function replayKey(puzzleId: string, playerId: string, solvedAt: number): string {
  return uuidv5(`${puzzleId}:${playerId}:${solvedAt}`);
}
