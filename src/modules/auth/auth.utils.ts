import crypto from "node:crypto";
import type { CookieOptions, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { unauthorized } from "../../errors/app-error.js";

// Cookie Constants
export const COOKIE_USER_SESSION = "user_session";
export const COOKIE_USER_TOKEN = "user_token";

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN?.trim() || undefined;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_shop_api_jwt_secret_key_2026";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_SALT_ROUNDS = 10;

export interface UserTokenPayload {
    userId: string;
}

/**
 * Hash plain-text password using bcrypt (cost factor 10)
 */
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compare plain-text password against stored bcrypt hash
 */
export const comparePassword = async (
    password: string,
    hash: string,
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/**
 * Generate a cryptographically secure 5-digit numeric OTP (10000 - 99999)
 */
export const generateOtpCode = (): string => {
    return crypto.randomInt(10000, 100000).toString();
};

/**
 * Generate 7-day JWT token for user
 */
export const generateUserToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

/**
 * Verify JWT token and return decoded payload
 */
export const verifyUserToken = (token: string): UserTokenPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
        if (!decoded || typeof decoded !== "object" || !decoded.userId) {
            throw unauthorized("توکن کاربر نامعتبر است");
        }
        return decoded;
    } catch {
        throw unauthorized("توکن احراز هویت نامعتبر یا منقضی شده است");
    }
};

/**
 * Enterprise Secure Cookie Baseline Options
 * Supports sharing across root domain and subdomains (e.g. example.com and api.example.com)
 */
export const getBaseCookieOptions = (): CookieOptions => ({
    signed: true,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    ...(isProduction && COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
});

/**
 * Set both signed user_session (browser session) and user_token (7-day persistent)
 */
export const setUserCookies = (res: Response, token: string): void => {
    const baseOptions = getBaseCookieOptions();

    // 1. Browser Session Signed Cookie (No maxAge -> deleted when browser closes)
    res.cookie(COOKIE_USER_SESSION, token, baseOptions);

    // 2. Persistent 7-Day Signed Cookie (Survives browser restarts)
    res.cookie(COOKIE_USER_TOKEN, token, {
        ...baseOptions,
        maxAge: SEVEN_DAYS_MS,
    });
};

/**
 * Re-issue signed user_session cookie when returning with valid user_token
 */
export const restoreUserSessionCookie = (res: Response, token: string): void => {
    res.cookie(COOKIE_USER_SESSION, token, getBaseCookieOptions());
};

/**
 * Clear both auth cookies upon logout
 * Uses identical options (domain, signed, httpOnly, secure, sameSite, path)
 * to guarantee compliant browsers immediately clear the cookies
 */
export const clearUserCookies = (res: Response): void => {
    const baseOptions = getBaseCookieOptions();
    res.clearCookie(COOKIE_USER_SESSION, baseOptions);
    res.clearCookie(COOKIE_USER_TOKEN, baseOptions);
};
