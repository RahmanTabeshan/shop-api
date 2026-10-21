import type { z } from "zod";
import type {
    loginPasswordSchema,
    sendOtpSchema,
    setPasswordSchema,
    verifyOtpSchema,
} from "./auth.validation.js";

// Request DTOs strictly inferred from Zod schemas
export type SendOtpDto = z.infer<typeof sendOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type LoginPasswordDto = z.infer<typeof loginPasswordSchema>;
export type SetPasswordDto = z.infer<typeof setPasswordSchema>;

// Response & Domain Models
export interface AuthUser {
    id: string;
    phone: string;
    hasPassword: boolean;
    createdAt: Date;
}

export interface SendOtpResponse {
    isNewUser: boolean;
    expiresIn: number;
    code?: string;
}

export interface AuthResult {
    user: AuthUser;
    token: string;
}
