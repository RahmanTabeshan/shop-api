import express, { type Router } from "express";
import { getApiStatus } from "./api.controller.js";

const apiRoutes: Router = express.Router();

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - General
 *     summary: بررسی وضعیت سلامت و کارکرد API
 *     responses:
 *       200:
 *         description: وضعیت موفق
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API is working
 */
apiRoutes.get("/", getApiStatus);

export default apiRoutes;