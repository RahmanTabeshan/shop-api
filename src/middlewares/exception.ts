import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isAppError } from "../errors/app-error.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Functional Global Exception Handler Middleware
 */
export const exceptionHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Handle Known Operational Application Errors (Functional Type Guard)
  if (isAppError(error)) {
    res.status(error.statusCode).json({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
    });
    return;
  }

  // 2. Handle Zod Validation Errors
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((issue) => ({
      field: issue.path.join(".") || "unknown",
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      statusCode: 400,
      message: "خطای اعتبارسنجی مقادیر ورودی",
      errors: formattedErrors,
    });
    return;
  }

  // 3. Handle Unexpected / Uncaught Server Errors (500)
  console.error("Unhandled Error:", error);

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: "خطای غیرمنتظره در سرور رخ داده است",
    ...(!isProduction ? { error: error.message, stack: error.stack } : {}),
  });
};

export default exceptionHandler;
