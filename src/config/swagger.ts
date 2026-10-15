import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Shop API Documentation",
      version: "1.0.0",
      description: "مستندات تعاملی REST API فروشگاه همراه با احراز هویت کوکی",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "محیط توسعه لوکال (Development)",
      },
    ],
    components: {
      securitySchemes: {
        sessionCookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
          description: "کوکی موقت سشن کاربر (Session Cookie)",
        },
        refreshCookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
          description: "کوکی پایدار ۷ روزه تمدید توکن (Refresh Cookie)",
        },
      },
    },
  },
  apis: [
    "./src/modules/**/*.routes.ts",
    "./src/routes/*.ts",
    "./dist/modules/**/*.routes.js",
  ],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const setupSwagger = (app: Express): void => {
  // Swagger UI route
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Shop API - Swagger UI",
    })
  );

  // Raw JSON spec route
  app.get("/api/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

export default setupSwagger;
