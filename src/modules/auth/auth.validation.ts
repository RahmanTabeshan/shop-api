/**
 * Auth Module Validation Schemas Placeholder
 * Ready to be connected with Zod schemas when finalizing input validation.
 */
export const authValidation = {
    loginPassword: {
        // phone: Iranian phone number format (e.g. /^09\d{9}$/)
        // password: string min 6 chars
    },
    sendOtp: {
        // phone: Iranian phone number format
    },
    verifyOtp: {
        // phone: Iranian phone number format
        // code: 5-digit numeric string
    },
    setPassword: {
        // newPassword: strong password min 8 chars
    },
};

export default authValidation;
