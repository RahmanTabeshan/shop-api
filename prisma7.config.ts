import "dotenv/config";
import { defineConfig } from "prisma/config";

const user = encodeURIComponent(process.env.DATABASE_USER || process.env.DB_USER || "postgres");
const pass = encodeURIComponent(process.env.DATABASE_PASS || process.env.DB_PASSWORD || "");
const host = encodeURIComponent(process.env.DATABASE_HOST || process.env.DB_HOST || "localhost");
const port = encodeURIComponent(process.env.DATABASE_PORT || process.env.DB_PORT || "5432");
const database_name = encodeURIComponent(process.env.DATABASE_NAME || process.env.DB_NAME || "shop_db");

const DATABASE_URL = process.env.DATABASE_URL || `postgresql://${user}:${pass}@${host}:${port}/${database_name}`;

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
