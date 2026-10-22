import prisma from "../../config/prisma.js";
import {
    badRequest,
    notFound,
    tooManyRequests,
    unauthorized,
} from "../../errors/app-error.js";
import { generateOtpCode, generateUserToken } from "./auth.utils.js";
import type {
    AuthResult,
    AuthUser,
    LoginPasswordDto,
    SendOtpDto,
    SendOtpResponse,
    SetPasswordDto,
    VerifyOtpDto,
} from "./auth.types.js";

// Mock user store for current testing phase
const sampleUser: AuthUser = {
    id: "sample-user-uuid-1",
    phone: "09121234567",
    hasPassword: true,
    createdAt: new Date(),
};

/**
 * Functional: Request 5-digit OTP with 2-minute expiration, 60s anti-spam cooldown,
 * opportunistic cleanup of expired records, and development mode code exposure.
 */
export const sendOtp = async (data: SendOtpDto): Promise<SendOtpResponse> => {
    // 1. Opportunistic Cleanup: Delete expired OTP records asynchronously in background
    prisma.otp
        .deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        })
        .catch((err) => {
            console.error("Opportunistic OTP cleanup error:", err);
        });

    // 2. Strict Rate Limit: Prevent new requests while previous OTP is still valid (2 minutes)
    const activeOtp = await prisma.otp.findFirst({
        where: {
            phone: data.phone,
            used: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
    });

    if (activeOtp) {
        const remainingMs = activeOtp.expiresAt.getTime() - Date.now();
        if (remainingMs > 0) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            throw tooManyRequests(
                `کد تأیید قبلی هنوز معتبر است. لطفاً ${remainingSeconds} ثانیه دیگر جهت درخواست مجدد شکیبا باشید`,
            );
        }
    }

    // Invalidate any previous unused OTP records for this phone
    await prisma.otp.updateMany({
        where: {
            phone: data.phone,
            used: false,
        },
        data: {
            used: true,
        },
    });

    // 3. Cryptographically secure 5-digit code generation
    const code = generateOtpCode();
    const expiresIn = 120; // 2 minutes (120 seconds)
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // 4. Save new OTP record to PostgreSQL
    await prisma.otp.create({
        data: {
            phone: data.phone,
            code,
            expiresAt,
        },
    });

    // 5. Check if user already exists in User table
    const existingUser = await prisma.user.findUnique({
        where: { phone: data.phone },
        select: { id: true },
    });
    const isNewUser = !existingUser;

    // 6. Handle Development vs Production exposure
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
        console.log(`[AUTH OTP DEV] Phone: ${data.phone} -> Code: ${code} (Expires in 2m)`);
    }

    return {
        isNewUser,
        expiresIn,
        ...(isDev ? { code } : {}),
    };
};

/**
 * Functional: Mock login with phone and password (issuing 7-day user token)
 */
export const loginWithPassword = async (
    data: LoginPasswordDto,
): Promise<AuthResult> => {
    const user: AuthUser = {
        ...sampleUser,
        phone: data.phone,
    };

    const token = generateUserToken(user.id);

    return {
        user,
        token,
    };
};

/**
 * Functional: Verify OTP code, enforce 5-attempt brute-force protection,
 * mark OTP as used, find or auto-register user, and issue 7-day user token.
 */
export const verifyOtp = async (
    data: VerifyOtpDto,
): Promise<AuthResult> => {
    // 1. Find the latest active and unexpired OTP record for this phone
    const activeOtp = await prisma.otp.findFirst({
        where: {
            phone: data.phone,
            used: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
    });

    if (!activeOtp) {
        throw badRequest(
            "کد تأیید نامعتبر است یا منقضی شده است. لطفاً مجدداً درخواست کد دهید",
        );
    }

    // 2. Check if attempts already reached max limit (5)
    if (activeOtp.attempts >= 5) {
        await prisma.otp.update({
            where: { id: activeOtp.id },
            data: { used: true },
        });
        throw tooManyRequests(
            "تعداد دفعات تلاش ناموفق بیش از حد مجاز است. لطفاً مجدداً درخواست کد دهید",
        );
    }

    // 3. Verify OTP code match
    if (activeOtp.code !== data.code) {
        const updatedOtp = await prisma.otp.update({
            where: { id: activeOtp.id },
            data: { attempts: { increment: 1 } },
        });
        const remainingAttempts = 5 - updatedOtp.attempts;

        if (remainingAttempts <= 0) {
            await prisma.otp.update({
                where: { id: activeOtp.id },
                data: { used: true },
            });
            throw tooManyRequests(
                "تعداد دفعات تلاش ناموفق بیش از حد مجاز است. لطفاً مجدداً درخواست کد دهید",
            );
        }

        throw badRequest(
            `کد تأیید وارد شده نادرست است (${remainingAttempts} تلاش باقی‌مانده)`,
        );
    }

    // 4. Code is correct: mark OTP as used
    await prisma.otp.update({
        where: { id: activeOtp.id },
        data: { used: true },
    });

    // Invalidate any other pending OTPs for this phone number
    await prisma.otp.updateMany({
        where: {
            phone: data.phone,
            used: false,
        },
        data: {
            used: true,
        },
    });

    // 5. Find existing user or auto-register new user in PostgreSQL
    let user = await prisma.user.findUnique({
        where: { phone: data.phone },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                phone: data.phone,
            },
        });
    }

    // 6. Format authenticated user object and generate 7-day token
    const authUser: AuthUser = {
        id: user.id,
        phone: user.phone,
        hasPassword: Boolean(user.password),
        createdAt: user.createdAt,
    };

    const token = generateUserToken(user.id);

    return {
        user: authUser,
        token,
    };
};

/**
 * Functional: Mock set or change password
 */
export const setPassword = async (
    _userId: string,
    _data: SetPasswordDto,
): Promise<{ success: boolean }> => {
    return { success: true };
};

/**
 * Functional: Get current user profile by ID from database
 */
export const getCurrentUser = async (userId?: string): Promise<AuthUser> => {
    if (!userId) {
        throw unauthorized("احراز هویت انجام نشده است");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw notFound("کاربری با این مشخصات یافت نشد");
    }

    return {
        id: user.id,
        phone: user.phone,
        hasPassword: Boolean(user.password),
        createdAt: user.createdAt,
    };
};
