import express from "express";
import { applyMiddlewares } from "./middlewares/middleware.js";
import routes from "./routes/routes.js";
import notFoundHandler from "./middlewares/not-found.js";
import exceptionHandler from "./middlewares/exception.js";
import setupSwagger from "./config/swagger.js";

export const app = express();

// Trust first proxy for accurate client IP resolution behind reverse proxies
app.set("trust proxy", 1);

// Middlewares
applyMiddlewares(app);

// Swagger Documentation
setupSwagger(app);

// Routes
app.use(routes);

// 404 and Error Handling
app.use(notFoundHandler);
app.use(exceptionHandler);
