import fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import fastifyCookie from '@fastify/cookie';
import jwtPlugin from "./plugins/jwt.plugin";
import authRoutes from "./routes/auth.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { tenantsRoutes } from "./routes/tenants.routes";
import { usersRoutes } from "./routes/users.routes";
import { nasRoutes } from "./routes/nas.routes";
import { profilesRoutes } from "./routes/profiles.routes";
import { adminsRoutes } from "./routes/admins.routes";
import vouchersRoutes from "./routes/vouchers.routes";
import webhooksRoutes from "./routes/webhooks.routes";
import settingsRoutes from "./routes/settings.routes";
import "./workers/voucher.worker";
export const buildApp = async () => {
    const app = fastify({
        logger: true,
    }).withTypeProvider();
    // Add Zod validation compilers
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    // Global Error Handler
    app.setErrorHandler((error, request, reply) => {
        if (error instanceof fastify.errorCodes.FST_ERR_VALIDATION) {
            return reply.status(400).send({
                statusCode: 400,
                error: "Bad Request",
                message: error.message,
            });
        }
        request.log.error(error);
        return reply.status(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: "An unexpected error occurred",
        });
    });
    // Register Plugins
    await app.register(fastifyCookie, {
        secret: process.env.COOKIE_SECRET || "super-secret-cookie-key",
        hook: 'onRequest'
    });
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
    app.register(adminsRoutes, { prefix: "/api/v1/admins" });
    // Register Skeleton Features
    app.register(vouchersRoutes, { prefix: "/api/v1/vouchers" });
    app.register(webhooksRoutes, { prefix: "/api/v1/webhooks" });
    app.register(settingsRoutes, { prefix: "/api/v1/settings" });
    // Healthcheck Route
    app.get("/health", async () => {
        return { status: "ok" };
    });
    return app;
};
// trigger restart
//# sourceMappingURL=app.js.map