import { Router } from "express";
import { authenticate } from "./auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { authLimiter } from "../../middlewares/rate-limit.js";
import {
    changePasswordHandler,
    loginPasswordHandler,
    logoutHandler,
    meHandler,
    sendChangePasswordOtpHandler,
    sendOtpHandler,
    setPasswordHandler,
    verifyOtpHandler,
} from "./auth.controller.js";
import {
    changePasswordSchema,
    loginPasswordSchema,
    sendOtpSchema,
    setPasswordSchema,
    verifyOtpSchema,
} from "./auth.validation.js";

const authRoutes: Router = Router();

// Rate limiting: 5 requests per 15 minutes per IP on auth endpoints
authRoutes.use(authLimiter);

/**
 * @openapi
 * /auth/login-password:
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
 * /auth/send-otp:
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
 *         description: کد تایید ارسال شد (یا در صورت درخواست قبل از اتمام ۲ دقیقه، کد قبلی معتبر و زمان باقی‌مانده در expiresIn بازمی‌گردد)
 *       400:
 *         description: شماره موبایل وارد شده نامعتبر است
 */
authRoutes.post(
    "/send-otp",
    validate(sendOtpSchema),
    sendOtpHandler,
);

/**
 * @openapi
 * /auth/verify-otp:
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
 * /auth/set-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: تعیین اولین رمز عبور برای کاربری که رمز ندارد (لاگین‌شده)
 *     security:
 *       - userSessionCookieAuth: []
 *       - userTokenCookieAuth: []
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
 *     responses:
 *       200:
 *         description: رمز عبور با موفقیت ذخیره شد
 *       400:
 *         description: کاربر قبلاً رمز تعیین کرده یا فرمت ورودی نامعتبر است
 *       401:
 *         description: احراز هویت انجام نشده است
 */
authRoutes.post(
    "/set-password",
    authenticate,
    validate(setPasswordSchema),
    setPasswordHandler,
);

/**
 * @openapi
 * /auth/change-password/send-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: درخواست ارسال کد ۵ رقمی برای تغییر رمز عبور کاربر لاگین‌شده
 *     security:
 *       - userSessionCookieAuth: []
 *       - userTokenCookieAuth: []
 *     responses:
 *       200:
 *         description: کد تایید ارسال شد (یا در صورت درخواست قبل از اتمام ۲ دقیقه، کد قبلی معتبر و زمان باقی‌مانده در expiresIn بازمی‌گردد)
 *       400:
 *         description: کاربر هنوز رمزی تعیین نکرده است
 *       401:
 *         description: احراز هویت انجام نشده است
 */
authRoutes.post(
    "/change-password/send-otp",
    authenticate,
    sendChangePasswordOtpHandler,
);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: تایید کد ۵ رقمی و ثبت رمز عبور جدید برای کاربر لاگین‌شده
 *     security:
 *       - userSessionCookieAuth: []
 *       - userTokenCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - newPassword
 *             properties:
 *               code:
 *                 type: string
 *                 example: "12345"
 *               newPassword:
 *                 type: string
 *                 example: "BrandNewSecurePassword123"
 *     responses:
 *       200:
 *         description: رمز عبور با موفقیت تغییر یافت
 *       400:
 *         description: کد تایید اشتباه است یا منقضی شده
 *       401:
 *         description: احراز هویت انجام نشده است
 *       429:
 *         description: تعداد تلاش‌های اشتباه بیش از حد مجاز است
 */
authRoutes.post(
    "/change-password",
    authenticate,
    validate(changePasswordSchema),
    changePasswordHandler,
);

/**
 * @openapi
 * /auth/logout:
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
 * /auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: دریافت مشخصات کاربر جاری از طریق کوکی‌های فعال (یا احیای خودکار با user_token)
 *     security:
 *       - userSessionCookieAuth: []
 *       - userTokenCookieAuth: []
 *     responses:
 *       200:
 *         description: مشخصات کاربر جاری
 *       401:
 *         description: احراز هویت انجام نشده است
 */
authRoutes.get("/me", authenticate, meHandler);

export default authRoutes;
