import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../errors/app-error.js";
import {
    COOKIE_USER_SESSION,
    COOKIE_USER_TOKEN,
    restoreUserSessionCookie,
} from "../modules/auth/auth.cookies.js";
import { verifyUserToken } from "../modules/auth/auth.security.js";

/**
 * Functional Authenticate Middleware
 * Implements signed dual-cookie authentication with automatic session restoration:
 * 1. Checks active signed user_session (or Bearer header)
 * 2. If user_session is missing (browser reopened), checks signed user_token (7-day persistent)
 *    and immediately restores user_session on the response!
 */
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    try {
        // Read from signedCookies (guaranteed tamper-proof by cookie-parser HMAC signature)
        const sessionToken =
            typeof req.signedCookies?.[COOKIE_USER_SESSION] === "string"
                ? req.signedCookies[COOKIE_USER_SESSION]
                : undefined;

        const persistentToken =
            typeof req.signedCookies?.[COOKIE_USER_TOKEN] === "string"
                ? req.signedCookies[COOKIE_USER_TOKEN]
                : undefined;

        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7).trim()
            : undefined;

        // 1. First priority: Active browser session cookie or Bearer header
        const activeToken = sessionToken || bearerToken;
        if (activeToken) {
            try {
                const payload = verifyUserToken(activeToken);
                req.user = { id: payload.userId };
                return next();
            } catch {
                // If session token expired, fallback to persistent token
            }
        }

        // 2. Second priority: Persistent 7-day signed cookie (user returned after closing browser)
        if (persistentToken) {
            try {
                const payload = verifyUserToken(persistentToken);
                req.user = { id: payload.userId };

                // Automatically restore user_session for the new browser session
                restoreUserSessionCookie(res, persistentToken);

                return next();
            } catch {
                // Persistent token is invalid or expired
            }
        }

        throw unauthorized("احراز هویت انجام نشده است یا نشست شما منقضی شده است");
    } catch (error) {
        next(error);
    }
};

export default authenticate;
