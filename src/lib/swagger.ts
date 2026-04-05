import { createSwaggerSpec } from "next-swagger-doc";

const apiFolder = `src/app/api`;

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: apiFolder,
    definition: {
      openapi: "3.0.0",
      info: { title: "Livon API", version: "1.0" },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
