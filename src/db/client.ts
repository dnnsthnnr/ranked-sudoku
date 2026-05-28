import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as controlSchema from "./schema/control";
import * as userSchema from "./schema/user";
import { players, userDbRegistry } from "./schema/control";
import { decryptToken } from "./crypto";

export type PlayerDbResolver = (playerId: string) => Promise<LibSQLDatabase<typeof userSchema>>;
export type AllUserDbsResolver = () => Promise<LibSQLDatabase<typeof userSchema>[]>;

export const controlDb = drizzle(
  createClient({
    url: process.env.CONTROL_DATABASE_URL!,
    authToken: process.env.CONTROL_DATABASE_AUTH_TOKEN,
  }),
  { schema: controlSchema },
);

// ─── Connection cache (keyed by user_db_registry.id) ─────────────────────────

const dbCache = new Map<string, LibSQLDatabase<typeof userSchema>>();

function openUserDb(
  registryId: string,
  dbUrl: string,
  encryptedToken: string,
): LibSQLDatabase<typeof userSchema> {
  const cached = dbCache.get(registryId);
  if (cached) return cached;
  const db = drizzle(createClient({ url: dbUrl, authToken: decryptToken(encryptedToken) }), {
    schema: userSchema,
  });
  dbCache.set(registryId, db);
  return db;
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

export function createPlayerDbResolver(
  db: LibSQLDatabase<typeof controlSchema> = controlDb,
): PlayerDbResolver {
  return async (playerId) => {
    const rows = await db
      .select({
        userDbId: players.userDbId,
        dbUrl: userDbRegistry.dbUrl,
        encryptedToken: userDbRegistry.encryptedToken,
      })
      .from(players)
      .innerJoin(userDbRegistry, eq(players.userDbId, userDbRegistry.id))
      .where(eq(players.id, playerId))
      .limit(1);

    const row = rows[0];
    if (!row) throw new Error(`No user DB found for player ${playerId}`);
    return openUserDb(row.userDbId, row.dbUrl, row.encryptedToken);
  };
}

export function createAllUserDbsResolver(
  db: LibSQLDatabase<typeof controlSchema> = controlDb,
): AllUserDbsResolver {
  return async () => {
    const pools = await db.query.userDbRegistry.findMany();
    return pools.map((p) => openUserDb(p.id, p.dbUrl, p.encryptedToken));
  };
}
