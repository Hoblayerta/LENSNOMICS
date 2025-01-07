import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the database connection with neon-serverless
export const db = drizzle({
  connectionString: process.env.DATABASE_URL,
  schema,
  ws,
});