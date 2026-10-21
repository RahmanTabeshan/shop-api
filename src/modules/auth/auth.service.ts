import prisma from "../../config/prisma.js";
import { tooManyRequests } from "../../errors/app-error.js";
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
 * Functional: Mock OTP verification and auto-login / register (issuing 7-day user token)
 */
export const verifyOtp = async (
    data: VerifyOtpDto,
): Promise<AuthResult> => {
    const isNewUser = data.phone !== sampleUser.phone;
    const user: AuthUser = {
        id: isNewUser ? `new-user-${Date.now()}` : sampleUser.id,
        phone: data.phone,
        hasPassword: !isNewUser,
        createdAt: new Date(),
    };

    const token = generateUserToken(user.id);

    return {
        user,
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
 * Functional: Mock get current user profile
 */
export const getCurrentUser = async (userId?: string): Promise<AuthUser> => {
    return {
        ...sampleUser,
        id: userId || sampleUser.id,
    };
};
