import { prisma } from "./prisma.js";

/**
 * Functional helper: Verifies connection to PostgreSQL database
 */
export const checkDbConnection = async (): Promise<boolean> => {
  try {
    // Attempt database handshake and test query
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection established successfully.");
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    return false;
  }
};

/**
 * Functional helper: Gracefully disconnects Prisma client
 */
export const disconnectDb = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log("🔌 Database disconnected gracefully.");
  } catch (error) {
    console.error("Error disconnecting database:", error);
  }
};
