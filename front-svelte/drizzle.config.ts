import { defineConfig } from "drizzle-kit";

// Use process.env for Drizzle Kit CLI
const connectionString = process.env.DATABASE_URL;

export default defineConfig({
    schema: "./src/lib/server/db/schema.ts",
    out: "./drizzle",
    dialect: "mysql",
    dbCredentials: {
        url: connectionString || '',
    },
});
