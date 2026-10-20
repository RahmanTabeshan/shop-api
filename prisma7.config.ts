import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const user = encodeURIComponent(env("DATABASE_USER"));
const pass = encodeURIComponent(env("DATABASE_PASS"));
const host = encodeURIComponent(env("DATABASE_HOST"));
const port = encodeURIComponent(env("DATABASE_PORT"));
const database_name = encodeURIComponent(env("DATABASE_NAME"));

const DATABASE_URL = `postgresql://${user}:${pass}@${host}:${port}/${database_name}`;

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
