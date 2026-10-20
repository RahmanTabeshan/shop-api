import { Router } from "express";
import {
    loginPasswordHandler,
    logoutHandler,
    meHandler,
    refreshHandler,
    sendOtpHandler,
    setPasswordHandler,
    verifyOtpHandler,
} from "./auth.controller.js";

const authRoutes: Router = Router();

/**
 * @openapi
 * /api/auth/login-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: ورود با شماره موبایل و رمز عبور (بدون ارسال پیامک)
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
 *         description: ورود موفق و ست شدن کوکی‌های session و refreshToken
 *       400:
 *         description: اطلاعات نامعتبر یا رمز عبور اشتباه
 */
authRoutes.post("/login-password", loginPasswordHandler);

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
authRoutes.post("/send-otp", sendOtpHandler);

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
authRoutes.post("/verify-otp", verifyOtpHandler);

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
authRoutes.post("/set-password", setPasswordHandler);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: تمدید سشن با کوکی پایدار رفرش‌توکن
 *     security:
 *       - refreshCookieAuth: []
 *     responses:
 *       200:
 *         description: سشن با موفقیت تمدید شد
 *       401:
 *         description: کوکی رفرش‌توکن یافت نشد یا منقضی شده
 */
authRoutes.post("/refresh", refreshHandler);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: خروج از حساب کاربری و پاک کردن هر دو کوکی
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
 *     summary: دریافت مشخصات کاربر جاری از طریق کوکی‌های فعال
 *     security:
 *       - sessionCookieAuth: []
 *     responses:
 *       200:
 *         description: مشخصات کاربر جاری
 *       401:
 *         description: احراز هویت انجام نشده است
 */
authRoutes.get("/me", meHandler);

export default authRoutes;
