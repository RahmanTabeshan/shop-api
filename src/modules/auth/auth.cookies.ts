import type { Response } from "express";

export const COOKIE_USER_SESSION = "user_session";
export const COOKIE_USER_TOKEN = "user_token";

const isProduction = process.env.NODE_ENV === "production";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Functional Helper: Set both signed user_session (browser session) and signed user_token (7-day persistent)
 */
export const setUserCookies = (res: Response, token: string): void => {
    // 1. Browser Session Signed Cookie (No maxAge -> deleted when browser closes)
    res.cookie(COOKIE_USER_SESSION, token, {
        signed: true,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
    });

    // 2. Persistent 7-Day Signed Cookie (Survives browser restarts)
    res.cookie(COOKIE_USER_TOKEN, token, {
        signed: true,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: SEVEN_DAYS_MS,
    });
};

/**
 * Functional Helper: Re-issue signed user_session cookie when returning with valid user_token
 */
export const restoreUserSessionCookie = (res: Response, token: string): void => {
    res.cookie(COOKIE_USER_SESSION, token, {
        signed: true,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
    });
};

/**
 * Functional Helper: Clear both cookies upon logout
 */
export const clearUserCookies = (res: Response): void => {
    res.clearCookie(COOKIE_USER_SESSION, { path: "/" });
    res.clearCookie(COOKIE_USER_TOKEN, { path: "/" });
};
