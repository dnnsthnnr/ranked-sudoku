import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema/control.ts",
  out: "./drizzle/control",
  dialect: "turso",
  dbCredentials: {
    url: process.env.CONTROL_DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
