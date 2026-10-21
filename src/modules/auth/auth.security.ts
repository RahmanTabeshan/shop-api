import jwt from "jsonwebtoken";
import { unauthorized } from "../../errors/app-error.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_shop_api_jwt_secret_key_2026";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

export interface UserTokenPayload {
    userId: string;
}

/**
 * Generate 7-day JWT token for authenticated user
 */
export const generateUserToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

/**
 * Verify JWT token and return decoded user payload
 */
export const verifyUserToken = (token: string): UserTokenPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
        if (!decoded || typeof decoded !== "object" || !decoded.userId) {
            throw unauthorized("توکن کاربر نامعتبر است");
        }
        return decoded;
    } catch {
        throw unauthorized("توکن احراز هویت نامعتبر یا منقضی شده است");
    }
};
