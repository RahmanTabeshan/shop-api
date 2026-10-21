import { z } from "zod";

const iranianPhoneRegex = /^09[01239]\d{8}$/;

/**
 * Reusable validation schema for Iranian mobile numbers
 */
export const phoneSchema = z
    .string({
        error: (iss) =>
            iss.input === undefined
                ? "وارد کردن شماره موبایل الزامی است"
                : "شماره موبایل باید رشته متنی باشد",
    })
    .trim()
    .regex(
        iranianPhoneRegex,
        "شماره موبایل وارد شده معتبر نمی‌باشد (فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹)",
    );

/**
 * Reusable validation schema for 5-digit numeric OTP code
 */
export const otpCodeSchema = z
    .string({
        error: (iss) =>
            iss.input === undefined
                ? "وارد کردن کد تأیید الزامی است"
                : "کد تأیید باید رشته متنی باشد",
    })
    .trim()
    .regex(/^\d{5}$/, "کد تأیید باید یک عدد ۵ رقمی باشد");

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
 * Request body schema for setting/changing password
 */
export const setPasswordSchema = z.object({
    newPassword: z
        .string({
            error: (iss) =>
                iss.input === undefined
                    ? "وارد کردن رمز عبور جدید الزامی است"
                    : "رمز عبور جدید باید رشته متنی باشد",
        })
        .min(6, "رمز عبور جدید باید حداقل ۶ کاراکتر باشد"),
    oldPassword: z
        .string({
            error: () => "رمز عبور فعلی باید رشته متنی باشد",
        })
        .optional(),
});
