import type { Request, Response } from "express";

export const getApiStatus = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
};