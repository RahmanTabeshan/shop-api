import { Router } from "express";
import apiRoutes from "../modules/api/api.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";

const routes: Router = Router();

routes.use("/api", apiRoutes);
routes.use("/api/auth", authRoutes);

export default routes;
