import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema/user.ts",
  out: "./drizzle/user",
  dialect: "turso",
  dbCredentials: {
    url: process.env.USER_DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
