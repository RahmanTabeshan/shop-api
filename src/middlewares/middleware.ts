import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

export const applyMiddlewares = (app: Express): void => {
    app.use(helmet());
    app.use(
        cors({
            origin: true,
            credentials: true,
        })
    );
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
};
