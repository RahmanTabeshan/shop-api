import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Read database connection components from environment
const dbUser = encodeURIComponent(process.env.DATABASE_USER || process.env.DB_USER || "");
const dbPassword = encodeURIComponent(process.env.DATABASE_PASS || process.env.DB_PASSWORD || "");
const dbHost = process.env.DATABASE_HOST || process.env.DB_HOST || "localhost";
const dbPort = process.env.DATABASE_PORT || process.env.DB_PORT || "5432";
const dbName = process.env.DATABASE_NAME || process.env.DB_NAME || "shop_db";

const connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

// Configure PostgreSQL connection pool and Prisma 7 driver adapter
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export default prisma;
