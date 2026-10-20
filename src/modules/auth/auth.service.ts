import type {
    AuthTokens,
    AuthUser,
    LoginPasswordDto,
    SendOtpDto,
    SendOtpResponse,
    SetPasswordDto,
    VerifyOtpDto,
} from "./auth.types.js";

// Mock user store for initial testing
const sampleUser: AuthUser = {
    id: "sample-user-uuid-1",
    phone: "09121234567",
    hasPassword: true,
    createdAt: new Date(),
};

/**
 * Functional: Mock login with phone and password
 */
export const loginWithPassword = async (
    data: LoginPasswordDto,
): Promise<{ user: AuthUser; tokens: AuthTokens }> => {
    return {
        user: {
            ...sampleUser,
            phone: data.phone,
        },
        tokens: {
            sessionToken: `mock-session-token-${Date.now()}`,
            refreshToken: `mock-refresh-token-${Date.now()}`,
        },
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
 * Functional: Mock OTP verification and auto-login / register
 */
export const verifyOtp = async (
    data: VerifyOtpDto,
): Promise<{ user: AuthUser; tokens: AuthTokens }> => {
    const isNewUser = data.phone !== sampleUser.phone;

    return {
        user: {
            id: isNewUser ? `new-user-${Date.now()}` : sampleUser.id,
            phone: data.phone,
            hasPassword: !isNewUser,
            createdAt: new Date(),
        },
        tokens: {
            sessionToken: `mock-session-token-${Date.now()}`,
            refreshToken: `mock-refresh-token-${Date.now()}`,
        },
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
 * Functional: Mock token refresh
 */
export const refreshSession = async (
    _refreshToken: string,
): Promise<{ sessionToken: string }> => {
    return {
        sessionToken: `mock-refreshed-session-${Date.now()}`,
    };
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
