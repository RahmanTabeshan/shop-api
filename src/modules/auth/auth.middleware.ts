import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../errors/app-error.js";
import {
    COOKIE_USER_SESSION,
    COOKIE_USER_TOKEN,
    restoreUserSessionCookie,
    verifyUserToken,
} from "./auth.utils.js";

/**
 * Functional Authenticate Middleware
 * Strictly reads authentication tokens ONLY from signed HTTP cookies:
 * 1. Checks active signed user_session cookie
 * 2. If user_session is missing (browser reopened), checks signed user_token cookie (7-day persistent)
 *    and immediately restores user_session on the response!
 */
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    try {
        // Strictly read ONLY from signed cookies (no headers accepted)
        const sessionToken =
            typeof req.signedCookies?.[COOKIE_USER_SESSION] === "string"
                ? req.signedCookies[COOKIE_USER_SESSION]
                : undefined;

        const persistentToken =
            typeof req.signedCookies?.[COOKIE_USER_TOKEN] === "string"
                ? req.signedCookies[COOKIE_USER_TOKEN]
                : undefined;

        // 1. First priority: Active signed user_session cookie
        if (sessionToken) {
            try {
                const payload = verifyUserToken(sessionToken);
                req.user = { id: payload.userId };
                return next();
            } catch {
                // If session token expired, fallback to persistent token
            }
        }

        // 2. Second priority: Persistent 7-day signed user_token cookie (user returned after closing browser)
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
