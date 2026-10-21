import { generateUserToken } from "./auth.security.js";
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
 * Functional: Mock sending OTP code (checks if new or existing user)
 */
export const sendOtp = async (data: SendOtpDto): Promise<SendOtpResponse> => {
    const isNewUser = data.phone !== sampleUser.phone;

    return {
        isNewUser,
        expiresIn: 120, // 2 minutes cooldown
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
