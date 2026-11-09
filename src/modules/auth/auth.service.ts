import prisma from "../../config/prisma.js";
import {
    badRequest,
    notFound,
    tooManyRequests,
    unauthorized,
} from "../../errors/app-error.js";
import {
    comparePassword,
    generateOtpCode,
    generateUserToken,
    hashPassword,
} from "./auth.utils.js";
import type {
    AuthResult,
    AuthUser,
    ChangePasswordDto,
    LoginPasswordDto,
    SendOtpDto,
    SendOtpResponse,
    SetPasswordDto,
    VerifyOtpDto,
} from "./auth.types.js";

const OTP_EXPIRATION_SECONDS = 120; // 2 minutes
const MAX_OTP_ATTEMPTS = 5;

/**
 * Functional Helper: Issue and store new 5-digit OTP with strict rate limit and opportunistic cleanup
 */
const createAndIssueOtp = async (
    phone: string,
    context = "AUTH",
): Promise<{ code: string; expiresIn: number }> => {
    // 1. Opportunistic Cleanup of expired OTPs asynchronously in background
    prisma.otp
        .deleteMany({
            where: { expiresAt: { lt: new Date() } },
        })
        .catch(() => {});

    // 2. Strict Rate Limit: Prevent new requests while previous active OTP is still valid (2 minutes)
    const activeOtp = await prisma.otp.findFirst({
        where: {
            phone,
            used: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        select: {
            expiresAt: true,
        },
    });

    if (activeOtp) {
        const remainingMs = activeOtp.expiresAt.getTime() - Date.now();
        if (remainingMs > 0) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            throw tooManyRequests(
                `کد تأیید قبلی هنوز معتبر است. لطفاً ${remainingSeconds} ثانیه دیگر جهت درخواست مجدد شکیبا باشید`,
                { remainingSeconds },
            );
        }
    }

    // 3. Invalidate previous unused OTP records for this phone
    await prisma.otp.updateMany({
        where: { phone, used: false },
        data: { used: true },
    });

    // 4. Cryptographically secure 5-digit code generation
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_SECONDS * 1000);

    await prisma.otp.create({
        data: {
            phone,
            code,
            expiresAt,
        },
    });

    if (process.env.NODE_ENV !== "production") {
        console.log(`[${context} OTP DEV] Phone: ${phone} -> Code: ${code} (Expires in 2m)`);
    }

    return {
        code,
        expiresIn: OTP_EXPIRATION_SECONDS,
    };
};

/**
 * Functional Helper: Verify OTP code with 5-attempt brute-force protection and mark as used
 */
const verifyAndConsumeOtp = async (phone: string, inputCode: string): Promise<void> => {
    // 1. Query active unexpired OTP using composite index
    const activeOtp = await prisma.otp.findFirst({
        where: {
            phone,
            used: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            code: true,
            attempts: true,
        },
    });

    if (!activeOtp) {
        throw badRequest("کد تأیید نامعتبر است یا منقضی شده است. لطفاً مجدداً درخواست کد دهید");
    }

    // 2. Check maximum brute-force attempts
    if (activeOtp.attempts >= MAX_OTP_ATTEMPTS) {
        await prisma.otp.update({
            where: { id: activeOtp.id },
            data: { used: true },
        });
        throw tooManyRequests("تعداد دفعات تلاش ناموفق بیش از حد مجاز است. لطفاً مجدداً درخواست کد دهید");
    }

    // 3. Verify OTP code match
    if (activeOtp.code !== inputCode) {
        const updatedOtp = await prisma.otp.update({
            where: { id: activeOtp.id },
            data: { attempts: { increment: 1 } },
        });
        const remainingAttempts = MAX_OTP_ATTEMPTS - updatedOtp.attempts;

        if (remainingAttempts <= 0) {
            await prisma.otp.update({
                where: { id: activeOtp.id },
                data: { used: true },
            });
            throw tooManyRequests("تعداد دفعات تلاش ناموفق بیش از حد مجاز است. لطفاً مجدداً درخواست کد دهید");
        }

        throw badRequest(`کد تأیید وارد شده نادرست است (${remainingAttempts} تلاش باقی‌مانده)`);
    }

    // 4. Code is correct: mark this OTP as used
    await prisma.otp.update({
        where: { id: activeOtp.id },
        data: { used: true },
    });

    // Invalidate any leftover OTPs for this phone
    await prisma.otp.updateMany({
        where: { phone, used: false },
        data: { used: true },
    });
};

/**
 * Functional: Request 5-digit OTP with 2-minute expiration, 60s anti-spam cooldown
 */
export const sendOtp = async (data: SendOtpDto): Promise<SendOtpResponse> => {
    const existingUser = await prisma.user.findUnique({
        where: { phone: data.phone },
        select: { id: true },
    });

    const { code, expiresIn } = await createAndIssueOtp(data.phone, "AUTH");
    const isDev = process.env.NODE_ENV !== "production";

    return {
        isNewUser: !existingUser,
        expiresIn,
        ...(isDev ? { code } : {}),
    };
};

/**
 * Functional: Login with phone and password (verifying against PostgreSQL and issuing 7-day user token)
 */
export const loginWithPassword = async (
    data: LoginPasswordDto,
): Promise<AuthResult> => {
    const user = await prisma.user.findUnique({
        where: { phone: data.phone },
        select: {
            id: true,
            phone: true,
            password: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw badRequest("شماره موبایل یا رمز عبور وارد شده نادرست است");
    }

    if (!user.password) {
        throw badRequest(
            "برای این حساب کاربری هنوز رمز عبوری تعیین نشده است. لطفاً از طریق کد تأیید (OTP) وارد شوید",
        );
    }

    const isMatch = await comparePassword(data.password, user.password);
    if (!isMatch) {
        throw badRequest("شماره موبایل یا رمز عبور وارد شده نادرست است");
    }

    const token = generateUserToken(user.id);
    const authUser: AuthUser = {
        id: user.id,
        phone: user.phone,
        hasPassword: true,
        createdAt: user.createdAt,
    };

    return {
        user: authUser,
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
    await verifyAndConsumeOtp(data.phone, data.code);

    let user = await prisma.user.findUnique({
        where: { phone: data.phone },
        select: {
            id: true,
            phone: true,
            password: true,
            createdAt: true,
        },
    });

    if (!user) {
        user = await prisma.user.create({
            data: { phone: data.phone },
            select: {
                id: true,
                phone: true,
                password: true,
                createdAt: true,
            },
        });
    }

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
 * Functional: Set initial password for authenticated user who has no password
 */
export const setPassword = async (
    userId: string,
    data: SetPasswordDto,
): Promise<{ success: boolean; message: string }> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
    });

    if (!user) {
        throw unauthorized("کاربری با این مشخصات یافت نشد");
    }

    if (user.password) {
        throw badRequest(
            "شما قبلاً برای این حساب کاربری رمز عبور تعیین کرده‌اید. جهت تغییر رمز عبور، از فرآیند تغییر رمز با کد تأیید پیامکی استفاده فرمایید",
        );
    }

    const hashedPassword = await hashPassword(data.newPassword);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    return {
        success: true,
        message: "رمز عبور با موفقیت ذخیره شد",
    };
};

/**
 * Functional: Request 5-digit OTP to change password for authenticated user with existing password
 */
export const sendChangePasswordOtp = async (
    userId: string,
): Promise<SendOtpResponse> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, phone: true, password: true },
    });

    if (!user) {
        throw unauthorized("کاربری با این مشخصات یافت نشد");
    }

    if (!user.password) {
        throw badRequest(
            "برای حساب کاربری شما هنوز رمز عبوری تعیین نشده است. لطفاً ابتدا از بخش تعیین رمز عبور اقدام فرمایید",
        );
    }

    const { code, expiresIn } = await createAndIssueOtp(user.phone, "CHANGE-PASSWORD");
    const isDev = process.env.NODE_ENV !== "production";

    return {
        isNewUser: false,
        expiresIn,
        ...(isDev ? { code } : {}),
    };
};

/**
 * Functional: Change password by verifying OTP code for authenticated user
 */
export const changePassword = async (
    userId: string,
    data: ChangePasswordDto,
): Promise<{ success: boolean; message: string }> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, phone: true, password: true },
    });

    if (!user) {
        throw unauthorized("کاربری با این مشخصات یافت نشد");
    }

    if (!user.password) {
        throw badRequest(
            "برای حساب کاربری شما هنوز رمز عبوری تعیین نشده است. لطفاً ابتدا از بخش تعیین رمز عبور اقدام فرمایید",
        );
    }

    await verifyAndConsumeOtp(user.phone, data.code);

    const hashedPassword = await hashPassword(data.newPassword);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    return {
        success: true,
        message: "رمز عبور با موفقیت تغییر یافت",
    };
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
        select: {
            id: true,
            phone: true,
            password: true,
            createdAt: true,
        },
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
