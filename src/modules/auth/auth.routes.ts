import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
    loginPasswordHandler,
    logoutHandler,
    meHandler,
    sendOtpHandler,
    setPasswordHandler,
    verifyOtpHandler,
} from "./auth.controller.js";
import {
    loginPasswordSchema,
    sendOtpSchema,
    setPasswordSchema,
    verifyOtpSchema,
} from "./auth.validation.js";

const authRoutes: Router = Router();

/**
 * @openapi
 * /api/auth/login-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: ورود با شماره موبایل و رمز عبور (ست شدن user_session و user_token)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "09121234567"
 *               password:
 *                 type: string
 *                 example: "SecretPass123"
 *     responses:
 *       200:
 *         description: ورود موفق و ست شدن کوکی‌های user_session و user_token
 *       400:
 *         description: اطلاعات نامعتبر یا رمز عبور اشتباه
 */
authRoutes.post(
    "/login-password",
    validate(loginPasswordSchema),
    loginPasswordHandler,
);

/**
 * @openapi
 * /api/auth/send-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: درخواست ارسال کد تایید یک‌بار مصرف (ثبت‌نام یا ورود)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "09121234567"
 *     responses:
 *       200:
 *         description: کد تایید ارسال شد و مشخص می‌کند کاربر جدید است یا قبلی
 */
authRoutes.post(
    "/send-otp",
    validate(sendOtpSchema),
    sendOtpHandler,
);

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: بررسی کد تایید و ورود / ثبت‌نام خودکار
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "09121234567"
 *               code:
 *                 type: string
 *                 example: "12345"
 *     responses:
 *       200:
 *         description: کد تایید شد و کوکی‌های ورود ست شدند
 */
authRoutes.post(
    "/verify-otp",
    validate(verifyOtpSchema),
    verifyOtpHandler,
);

/**
 * @openapi
 * /api/auth/set-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: تعیین یا ویرایش رمز عبور در پنل کاربری
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "NewStrongPassword123"
 *               oldPassword:
 *                 type: string
 *                 example: "OldPassword123"
 *     responses:
 *       200:
 *         description: رمز عبور با موفقیت ذخیره شد
 */
authRoutes.post(
    "/set-password",
    authenticate,
    validate(setPasswordSchema),
    setPasswordHandler,
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: خروج از حساب کاربری و پاک کردن هر دو کوکی user_session و user_token
 *     responses:
 *       200:
 *         description: کوکی‌ها با موفقیت پاک شدند
 */
authRoutes.post("/logout", logoutHandler);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: دریافت مشخصات کاربر جاری از طریق کوکی‌های فعال (یا احیای خودکار با user_token)
 *     security:
 *       - sessionCookieAuth: []
 *     responses:
 *       200:
 *         description: مشخصات کاربر جاری
 *       401:
 *         description: احراز هویت انجام نشده است
 */
authRoutes.get("/me", authenticate, meHandler);

export default authRoutes;
