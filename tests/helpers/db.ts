import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { AllUserDbsResolver, PlayerDbResolver } from "@/db/client";
import * as controlSchema from "@/db/schema/control";
import * as userSchema from "@/db/schema/user";
import { userDbRegistry } from "@/db/schema/control";

export async function createTestDb() {
  // Both planes share the same in-memory SQLite instance for tests.
  const client = createClient({ url: "file::memory:" });
  const controlDb = drizzle(client, { schema: controlSchema });
  const userDb = drizzle(client, { schema: userSchema });
  await migrate(controlDb, { migrationsFolder: "./drizzle/control" });
  await migrate(userDb, { migrationsFolder: "./drizzle/user" });

  // Insert a default pool entry so tests can create players with a valid userDbId.
  const defaultUserDbId = crypto.randomUUID();
  await controlDb.insert(userDbRegistry).values({
    id: defaultUserDbId,
    dbUrl: "file::memory:",
    encryptedToken: "test",
  });

  // Resolvers that always return the shared in-memory DB — no encryption needed.
  const getPlayerDb: PlayerDbResolver = async () =>
    userDb as unknown as LibSQLDatabase<typeof userSchema>;
  const getAllUserDbs: AllUserDbsResolver = async () => [
    userDb as unknown as LibSQLDatabase<typeof userSchema>,
  ];

  return { client, controlDb, userDb, defaultUserDbId, getPlayerDb, getAllUserDbs };
}
