import dotenv from "dotenv";
import { app } from "./app.js";
import { checkDbConnection, disconnectDb } from "./config/dbconnect.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Functional Server Startup:
 * Checks database connectivity before launching the HTTP server
 */
const startServer = async (): Promise<void> => {
  console.log("⏳ Checking database connection...");

  const isConnected = await checkDbConnection();

  if (!isConnected) {
    console.error("⛔ Server startup aborted: Could not connect to PostgreSQL database.");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(
      `🚀 Server is running in ${process.env.NODE_ENV || "development"} mode on Port:${PORT}`
    );
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
};

startServer();
