export type UserRole = "CUSTOMER" | "ADMIN";

export interface AuthUser {
  id: string;
  phone: string;
  role: UserRole;
  hasPassword: boolean;
  createdAt: Date;
}

export interface LoginPasswordDto {
  phone: string;
  password: string;
}

export interface SendOtpDto {
  phone: string;
}

export interface SendOtpResponse {
  isNewUser: boolean;
  expiresIn: number;
}

export interface VerifyOtpDto {
  phone: string;
  code: string;
}

export interface SetPasswordDto {
  newPassword: string;
  oldPassword?: string;
}

export interface AuthTokens {
  sessionToken: string;
  refreshToken: string;
}
