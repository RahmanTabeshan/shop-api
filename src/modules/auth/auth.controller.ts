import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../errors/app-error.js";
import {
    getCurrentUser,
    loginWithPassword,
    refreshSession,
    sendOtp,
    setPassword,
    verifyOtp,
} from "./auth.service.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Functional helper: Set session and 7-day refresh cookies
 */
const setAuthCookies = (
    res: Response,
    sessionToken: string,
    refreshToken: string,
): void => {
    res.cookie("session", sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
};

/**
 * Functional helper: Clear auth cookies
 */
const clearAuthCookies = (res: Response): void => {
    res.clearCookie("session", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
};

/**
 * Functional Request Handler: POST /api/auth/login-password
 */
export const loginPasswordHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { user, tokens } = await loginWithPassword(req.body);
        setAuthCookies(res, tokens.sessionToken, tokens.refreshToken);

        res.status(200).json({
            success: true,
            message: "ورود با رمز عبور با موفقیت انجام شد (نمونه)",
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Functional Request Handler: POST /api/auth/send-otp
 */
export const sendOtpHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const result = await sendOtp(req.body);

        res.status(200).json({
            success: true,
            message: result.isNewUser
                ? "کد تأیید برای ثبت‌نام ارسال شد (نمونه)"
                : "کد تأیید برای ورود ارسال شد (نمونه)",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Functional Request Handler: POST /api/auth/verify-otp
 */
export const verifyOtpHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { user, tokens } = await verifyOtp(req.body);
        setAuthCookies(res, tokens.sessionToken, tokens.refreshToken);

        res.status(200).json({
            success: true,
            message: "کد تأیید با موفقیت بررسی شد و ورود انجام شد (نمونه)",
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Functional Request Handler: POST /api/auth/set-password
 */
export const setPasswordHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.cookies.session ? "sample-user-id" : undefined;
        await setPassword(userId || "sample-user-id", req.body);

        res.status(200).json({
            success: true,
            message: "رمز عبور با موفقیت ذخیره شد (نمونه)",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Functional Request Handler: POST /api/auth/refresh
 */
export const refreshHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw unauthorized("کوکی رفرش‌توکن یافت نشد (نیاز به ورود مجدد)");
        }

        const { sessionToken } = await refreshSession(refreshToken);

        res.cookie("session", sessionToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
        });

        res.status(200).json({
            success: true,
            message: "سشن با موفقیت تمدید شد (نمونه)",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Functional Request Handler: POST /api/auth/logout
 */
export const logoutHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        clearAuthCookies(res);

        res.status(200).json({
            success: true,
            message: "با موفقیت از حساب خارج شدید (کوکی‌ها پاک شدند)",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Functional Request Handler: GET /api/auth/me
 */
export const meHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const session = req.cookies.session;
        const refreshToken = req.cookies.refreshToken;

        if (!session && !refreshToken) {
            throw unauthorized(
                "احراز هویت انجام نشده است (کوکی معتبری یافت نشد)",
            );
        }

        const user = await getCurrentUser();

        res.status(200).json({
            success: true,
            message: "اطلاعات کاربر جاری (نمونه)",
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};
