import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ReplayData } from "@/lib/replay";

export interface ReplayStore {
  put(key: string, data: ReplayData): Promise<void>;
  get(key: string): Promise<ReplayData | null>;
}

export class LocalFileReplayStore implements ReplayStore {
  constructor(private readonly dir = "data/replays") {}

  async put(key: string, data: ReplayData): Promise<void> {
    const filePath = join(this.dir, `${key}.json`);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async get(key: string): Promise<ReplayData | null> {
    const filePath = join(this.dir, `${key}.json`);
    try {
      const content = await readFile(filePath, "utf-8");
      return JSON.parse(content) as ReplayData;
    } catch {
      return null;
    }
  }
}

let _store: ReplayStore | null = null;

export function getReplayStore(): ReplayStore {
  if (!_store) {
    const url = process.env.DATABASE_URL ?? "";
    if (url.startsWith("file:") || process.env.REPLAY_STORAGE === "local") {
      _store = new LocalFileReplayStore();
    } else {
      // TODO: return R2ReplayStore for production
      _store = new LocalFileReplayStore();
    }
  }
  return _store;
}
