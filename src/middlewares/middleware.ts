import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsOptions } from "../config/cors.js";

const COOKIE_SECRET = process.env.COOKIE_SECRET || "fallback_dev_shop_api_cookie_secret_2026";

export const applyMiddlewares = (app: Express): void => {
    app.use(helmet());
    app.use(cors(corsOptions));
    app.use(cookieParser(COOKIE_SECRET));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
};
