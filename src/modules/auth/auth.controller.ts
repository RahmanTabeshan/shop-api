import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../errors/app-error.js";
import { clearUserCookies, setUserCookies } from "./auth.utils.js";
import {
    getCurrentUser,
    loginWithPassword,
    sendOtp,
    setPassword,
    verifyOtp,
} from "./auth.service.js";
import type {
    LoginPasswordDto,
    SendOtpDto,
    SetPasswordDto,
    VerifyOtpDto,
} from "./auth.types.js";

/**
 * Functional Request Handler: POST /api/auth/login-password
 */
export const loginPasswordHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const payload = req.body as LoginPasswordDto;
        const { user, token } = await loginWithPassword(payload);
        setUserCookies(res, token);

        res.status(200).json({
            success: true,
            message: "ورود با رمز عبور با موفقیت انجام شد",
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
        const payload = req.body as SendOtpDto;
        const result = await sendOtp(payload);

        res.status(200).json({
            success: true,
            message: result.isNewUser
                ? "کد تأیید برای ثبت‌نام ارسال شد"
                : "کد تأیید برای ورود ارسال شد",
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
        const payload = req.body as VerifyOtpDto;
        const { user, token } = await verifyOtp(payload);
        setUserCookies(res, token);

        res.status(200).json({
            success: true,
            message: "کد تأیید با موفقیت بررسی شد و ورود انجام شد",
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
        const payload = req.body as SetPasswordDto;
        const userId = req.user?.id;
        if (!userId) {
            throw unauthorized(
                "برای ثبت یا تغییر رمز عبور ابتدا باید وارد حساب کاربری خود شوید",
            );
        }

        await setPassword(userId, payload);

        res.status(200).json({
            success: true,
            message: "رمز عبور با موفقیت ذخیره شد",
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
        clearUserCookies(res);

        res.status(200).json({
            success: true,
            message: "با موفقیت از حساب کاربری خارج شدید",
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
        const userId = req.user?.id;
        if (!userId) {
            throw unauthorized("احراز هویت انجام نشده است");
        }

        const user = await getCurrentUser(userId);

        res.status(200).json({
            success: true,
            message: "اطلاعات حساب کاربر جاری",
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};
