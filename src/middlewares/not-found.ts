import type { Request, Response } from "express";

export const notFoundHandler = (_req: Request, res: Response) => {
    res.status(404).json({
        status: 404,
        message: "صفحه مورد نظر یافت نشد",
        Code: "Not Found",
    });
};

export default notFoundHandler;