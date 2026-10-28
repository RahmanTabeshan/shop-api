import { z } from "zod";

const iranianPhoneRegex = /^09[01239]\d{8}$/;

/**
 * Utility: Convert Persian and Arabic numbers to Latin English digits
 */
export const toEnglishDigits = (value: string): string => {
    return value
        .replace(/[۰-۹]/g, (char) => String(char.charCodeAt(0) - 1776))
        .replace(/[٠-٩]/g, (char) => String(char.charCodeAt(0) - 1632));
};

/**
 * Utility: Normalize Iranian mobile number input (handles Persian digits, +98, 0098, and spaces)
 */
export const normalizeIranianPhone = (value: unknown): unknown => {
    if (typeof value !== "string") return value;
    let normalized = toEnglishDigits(value).trim().replace(/[\s\-_()]/g, "");
    if (normalized.startsWith("+98")) {
        normalized = "0" + normalized.slice(3);
    } else if (normalized.startsWith("0098")) {
        normalized = "0" + normalized.slice(4);
    } else if (normalized.startsWith("98") && normalized.length === 12) {
        normalized = "0" + normalized.slice(2);
    }
    return normalized;
};

/**
 * Utility: Normalize OTP code (handles Persian digits and spaces)
 */
export const normalizeOtpCode = (value: unknown): unknown => {
    if (typeof value !== "string") return value;
    return toEnglishDigits(value).trim().replace(/\s/g, "");
};

/**
 * Reusable validation schema for Iranian mobile numbers
 */
export const phoneSchema = z.preprocess(
    normalizeIranianPhone,
    z
        .string({
            error: (iss) =>
                iss.input === undefined
                    ? "وارد کردن شماره موبایل الزامی است"
                    : "شماره موبایل باید رشته متنی باشد",
        })
        .regex(
            iranianPhoneRegex,
            "شماره موبایل وارد شده معتبر نمی‌باشد (فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹)",
        ),
);

/**
 * Reusable validation schema for 5-digit numeric OTP code
 */
export const otpCodeSchema = z.preprocess(
    normalizeOtpCode,
    z
        .string({
            error: (iss) =>
                iss.input === undefined
                    ? "وارد کردن کد تأیید الزامی است"
                    : "کد تأیید باید رشته متنی باشد",
        })
        .regex(/^\d{5}$/, "کد تأیید باید یک عدد ۵ رقمی باشد"),
);

/**
 * Reusable validation schema for user password
 */
export const passwordSchema = z
    .string({
        error: (iss) =>
            iss.input === undefined
                ? "وارد کردن رمز عبور الزامی است"
                : "رمز عبور باید رشته متنی باشد",
    })
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد");

/**
 * Request body schema for requesting OTP
 */
export const sendOtpSchema = z.object({
    phone: phoneSchema,
});

/**
 * Request body schema for verifying OTP
 */
export const verifyOtpSchema = z.object({
    phone: phoneSchema,
    code: otpCodeSchema,
});

/**
 * Request body schema for password login
 */
export const loginPasswordSchema = z.object({
    phone: phoneSchema,
    password: passwordSchema,
});

/**
 * Request body schema for setting initial password (for users without a password)
 */
export const setPasswordSchema = z.object({
    newPassword: passwordSchema,
});

/**
 * Request body schema for changing password with OTP code
 */
export const changePasswordSchema = z.object({
    code: otpCodeSchema,
    newPassword: passwordSchema,
});
