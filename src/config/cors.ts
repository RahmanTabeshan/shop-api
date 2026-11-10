import type { CorsOptions } from "cors";
import { forbidden } from "../errors/app-error.js";

/**
 * Retrieve and normalize allowed origins from the environment variable
 */
const getAllowedOrigins = (): string[] => {
  const origins = process.env.ALLOWED_ORIGINS;
  if (!origins) {
    return [];
  }
  return origins
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
};

/**
 * Enterprise Production-Ready CORS Options
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // 1. In development mode, permit all incoming origins
    if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
      return callback(null, true);
    }

    // 2. Permit non-browser server-to-server or API client requests (where origin is undefined)
    if (!origin) {
      return callback(null, true);
    }

    // 3. In production mode, strictly validate against ALLOWED_ORIGINS whitelist
    const allowedOrigins = getAllowedOrigins();
    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(
      forbidden(`CORS policy violation: Origin '${origin}' is not allowed by policy`)
    );
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400, // Caches Preflight OPTIONS response for up to 24 hours in the browser
  optionsSuccessStatus: 204, // 204 No Content for clean preflight responses
};
