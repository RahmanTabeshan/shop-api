import { Router } from "express";
import apiRoutes from "../modules/api/api.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";

const rawBaseUrl = process.env.BASE_URL?.trim() || "";
const baseUrl = rawBaseUrl
    ? (rawBaseUrl.startsWith("/") ? rawBaseUrl : `/${rawBaseUrl}`).replace(/\/+$/, "")
    : "";

const routes: Router = Router();

// Dynamic route mounting: if BASE_URL is set (e.g. "/api"), routes become /api/auth, /api
// If BASE_URL is empty, routes mount directly without prefix: /auth, /
const authPath = `${baseUrl}/auth`;
const apiPath = baseUrl || "/";

routes.use(apiPath, apiRoutes);
routes.use(authPath, authRoutes);

export default routes;
