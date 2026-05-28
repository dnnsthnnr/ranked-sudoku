import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as controlSchema from "./schema/control";
import * as userSchema from "./schema/user";

export const controlDb = drizzle(
  createClient({
    url: process.env.CONTROL_DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  }),
  { schema: controlSchema },
);

export const userDb = drizzle(
  createClient({
    url: process.env.USER_DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  }),
  { schema: userSchema },
);

// Returns the user-data DB for the given player.
// Today both clients point to the same DB (single-DB mode).
// Future: look up user_db_registry in controlDb and open the right pool connection.
export async function getUserDb(_playerId: string) {
  return userDb;
}
