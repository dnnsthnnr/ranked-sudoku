import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as controlSchema from "@/db/schema/control";
import * as userSchema from "@/db/schema/user";

export async function createTestDb() {
  // Both planes share the same in-memory SQLite instance for tests.
  const client = createClient({ url: "file::memory:" });
  const controlDb = drizzle(client, { schema: controlSchema });
  const userDb = drizzle(client, { schema: userSchema });
  await migrate(controlDb, { migrationsFolder: "./drizzle/control" });
  await migrate(userDb, { migrationsFolder: "./drizzle/user" });
  return { client, controlDb, userDb };
}
