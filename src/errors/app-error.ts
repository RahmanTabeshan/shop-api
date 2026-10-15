/**
 * Custom AppError Interface
 */
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: unknown;
}

/**
 * Type Guard to check if an unknown error is an AppError
 */
export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    "isOperational" in error
  );
};

/**
 * Functional Factory for creating AppError instances
 */
export const createAppError = (
  statusCode = 500,
  message = "خطایی در سرور رخ داده است",
  isOperational = true,
  errors?: unknown
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = isOperational;
  error.errors = errors;
  return error;
};

// Pure Helper Factory Functions for common HTTP errors
export const badRequest = (message = "درخواست نامعتبر است", errors?: unknown): AppError =>
  createAppError(400, message, true, errors);

export const unauthorized = (message = "احراز هویت انجام نشده است یا نشست منقضی شده است"): AppError =>
  createAppError(401, message, true);

export const forbidden = (message = "شما دسترسی لازم برای انجام این عملیات را ندارید"): AppError =>
  createAppError(403, message, true);

export const notFound = (message = "موردی با این مشخصات یافت نشد"): AppError =>
  createAppError(404, message, true);

export const conflict = (message = "اطلاعات ارسالی با داده‌های موجود در سیستم مغایرت دارد"): AppError =>
  createAppError(409, message, true);

export const tooManyRequests = (message = "تعداد درخواست‌های ارسالی بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید"): AppError =>
  createAppError(429, message, true);

export const internalError = (message = "خطای غیرمنتظره در سرور رخ داده است"): AppError =>
  createAppError(500, message, false);
