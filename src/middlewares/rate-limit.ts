import rateLimit from "express-rate-limit";

/**
 * Enterprise Rate Limiter for Authentication & Sensitive Operations
 * - Restricts each client IP to a maximum of 100 attempts per 15-minute window.
 * - Accommodates shared corporate networks, university Wi-Fi, and carrier-grade NAT (CGNAT).
 * - Per-phone security (2-minute cooldown, 5 max attempts) is strictly enforced in the service/DB layer.
 * - Safely skips non-abusable operations (e.g. GET /auth/me and POST /auth/logout).
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute sliding window
    limit: 100, // Maximum 100 requests per IP window (supports shared corporate NAT / mobile data)
    standardHeaders: "draft-8", // Standard IETF RateLimit headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
    legacyHeaders: false, // Omit deprecated X-RateLimit headers
    statusCode: 429,
    skip: (req) => {
        // 1. Skip safe read-only operations (e.g. GET /auth/me) to prevent locking out active browsing
        if (req.method === "GET") {
            return true;
        }

        // 2. Skip logout so users can always securely terminate their session
        const path = req.path.toLowerCase().replace(/\/$/, "");
        if (path === "/logout" || path.endsWith("/logout")) {
            return true;
        }

        return false;
    },
    message: {
        success: false,
        statusCode: 429,
        message: "تعداد درخواست‌های ارسالی بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش فرمایید",
    },
    handler: (_req, res, _next, options) => {
        res.status(options.statusCode).json(options.message);
    },
});

export default authLimiter;
