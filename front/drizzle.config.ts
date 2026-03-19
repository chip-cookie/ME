import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./data/db/jasos.db";

// sqlite:///./path → file:./path 변환
const normalizedUrl = url.startsWith("sqlite:///./")
  ? `file:./${url.slice("sqlite:///./".length)}`
  : url.startsWith("sqlite:////")
    ? `file:/${url.slice("sqlite:////".length)}`
    : url;

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "turso",
  dbCredentials: {
    url: normalizedUrl,
  },
});
