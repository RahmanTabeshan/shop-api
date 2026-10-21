import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export type RequestPart = "body" | "params" | "query";

/**
 * Defensive Security Check: Recursive scanner for Prototype Pollution attacks
 */
const containsPrototypePollution = (target: unknown, depth = 0): boolean => {
    if (!target || typeof target !== "object" || depth > 5) {
        return false;
    }

    const keys = Object.getOwnPropertyNames(target);
    for (const key of keys) {
        if (
            key === "__proto__" ||
            key === "constructor" ||
            key === "prototype"
        ) {
            return true;
        }

        const value = (target as Record<string, unknown>)[key];
        if (
            value &&
            typeof value === "object" &&
            containsPrototypePollution(value, depth + 1)
        ) {
            return true;
        }
    }

    return false;
};

/**
 * Zero-Trust Multi-Part Validation Middleware
 * Validates, hardens, and sanitizes incoming body, query, or params with Zod
 */
export const validate = (schema: ZodType, part: RequestPart = "body") => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            // 1. Zero-Trust Check: Request object integrity
            if (!req || typeof req !== "object") {
                res.status(500).json({
                    success: false,
                    statusCode: 500,
                    message: "شیء درخواست سرور (Request) نامعتبر است",
                });
                return;
            }

            // 2. Zero-Trust Check: Allowed target part whitelist
            const validParts: RequestPart[] = ["body", "params", "query"];
            if (!validParts.includes(part)) {
                res.status(500).json({
                    success: false,
                    statusCode: 500,
                    message: `بخش هدف اعتبارسنجی نامعتبر است: ${String(part)}`,
                });
                return;
            }

            // 3. Zero-Trust Check: Schema integrity
            if (!schema || typeof schema.safeParseAsync !== "function") {
                res.status(500).json({
                    success: false,
                    statusCode: 500,
                    message: "اسکیمای اعتبارسنجی ارائه‌شده نامعتبر است",
                });
                return;
            }

            // 4. Security Hardening: Prototype Pollution Defense
            if (containsPrototypePollution(req[part])) {
                res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: "درخواست ارسالی حاوی کلیدهای غیرمجاز و ناامن است",
                });
                return;
            }

            // 5. Strict Input Check: Presence of data for body
            const rawData = req[part];
            if (part === "body" && (rawData === undefined || rawData === null)) {
                res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: "بدنه درخواست (Body) ارسال نشده است یا خالی می‌باشد",
                });
                return;
            }

            const inputData =
                typeof rawData === "object" && rawData !== null
                    ? rawData
                    : {};

            // 6. Safe Asynchronous Validation
            const result = await schema.safeParseAsync(inputData);

            // 7. Standardized Error Formatting
            if (!result.success) {
                const formattedErrors = (result.error.issues || []).map((issue) => {
                    const pathString =
                        Array.isArray(issue.path) && issue.path.length > 0
                            ? issue.path.join(".")
                            : part;

                    return {
                        field: pathString,
                        code: issue.code || "custom",
                        message: issue.message || "مقدار وارد شده نامعتبر است",
                    };
                });

                res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: "اطلاعات وارد شده معتبر نمی‌باشد",
                    errors: formattedErrors,
                });
                return;
            }

            // 8. Strict Data Assignment & Sanitization
            if (part === "query") {
                // Wipe unauthorized query parameters, leaving only validated data
                for (const key of Object.keys(req.query)) {
                    delete (req.query as Record<string, unknown>)[key];
                }
                Object.assign(req.query, result.data);
            } else if (part === "params") {
                Object.assign(req.params, result.data);
            } else {
                req.body = result.data;
            }

            next();
        } catch (error) {
            // Absolute catch-all: Never allow unhandled exceptions to crash the server
            next(error);
        }
    };
};

export default validate;
