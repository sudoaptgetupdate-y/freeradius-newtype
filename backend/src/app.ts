import fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import jwtPlugin from "./plugins/jwt.plugin";
import authRoutes from "./routes/auth.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { tenantsRoutes } from "./routes/tenants.routes";
import { usersRoutes } from "./routes/users.routes";
import { nasRoutes } from "./routes/nas.routes";
import { profilesRoutes } from "./routes/profiles.routes";

export const buildApp = async () => {
  const app = fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();

  // Add Zod validation compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register Plugins
  await app.register(cors, {
    origin: "*", // Allow all origins for local development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  await app.register(jwtPlugin);

  // Register Routes
  app.register(authRoutes, { prefix: "/api/v1/auth" });
  app.register(dashboardRoutes, { prefix: "/api/v1/dashboard" });
  app.register(usersRoutes, { prefix: "/api/v1/users" });
  app.register(tenantsRoutes, { prefix: "/api/v1/tenants" });
  app.register(nasRoutes, { prefix: "/api/v1/nas" });
  app.register(profilesRoutes, { prefix: "/api/v1/profiles" });

  // Healthcheck Route
  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
};

// trigger restart
