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
        userSessionCookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "user_session",
          description: "کوکی امضاشده سشن موقت کاربر عادی (Browser Session Cookie)",
        },
        userTokenCookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "user_token",
          description: "کوکی امضاشده پایدار ۷ روزه کاربر عادی (Persistent Cookie)",
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
