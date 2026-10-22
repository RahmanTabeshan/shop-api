import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

const rawBaseUrl = process.env.BASE_URL?.trim() || "";
const baseUrl = rawBaseUrl
    ? (rawBaseUrl.startsWith("/") ? rawBaseUrl : `/${rawBaseUrl}`).replace(/\/+$/, "")
    : "";

const port = process.env.PORT || "5000";

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
        url: `http://localhost:${port}${baseUrl}`,
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
  const docsPath = baseUrl ? `${baseUrl}/docs` : "/docs";

  // Swagger UI route
  app.use(
    docsPath,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Shop API - Swagger UI",
    })
  );

  // Raw JSON spec route
  app.get(`${docsPath}.json`, (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

export default setupSwagger;
