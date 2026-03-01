import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Path to your schema file(s)
  schema: "./drizzle/schema.ts",

  // Output directory for generated SQL migrations
  out: "./drizzle/migrations",

  // MySQL dialect
  dialect: "mysql",

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // Print every SQL statement drizzle-kit runs
  verbose: true,

  // Ask for confirmation before destructive operations
  strict: true,
});
