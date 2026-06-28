"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const jwt_plugin_1 = __importDefault(require("./plugins/jwt.plugin"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = require("./routes/dashboard.routes");
const tenants_routes_1 = require("./routes/tenants.routes");
const users_routes_1 = require("./routes/users.routes");
const nas_routes_1 = require("./routes/nas.routes");
const profiles_routes_1 = require("./routes/profiles.routes");
const buildApp = async () => {
    const app = (0, fastify_1.default)({
        logger: true,
    }).withTypeProvider();
    // Add Zod validation compilers
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    // Register Plugins
    await app.register(cors_1.default, {
        origin: "*", // Allow all origins for local development
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });
    await app.register(rate_limit_1.default, {
        max: 100,
        timeWindow: '1 minute'
    });
    await app.register(jwt_plugin_1.default);
    // Register Routes
    app.register(auth_routes_1.default, { prefix: "/api/v1/auth" });
    app.register(dashboard_routes_1.dashboardRoutes, { prefix: "/api/v1/dashboard" });
    app.register(users_routes_1.usersRoutes, { prefix: "/api/v1/users" });
    app.register(tenants_routes_1.tenantsRoutes, { prefix: "/api/v1/tenants" });
    app.register(nas_routes_1.nasRoutes, { prefix: "/api/v1/nas" });
    app.register(profiles_routes_1.profilesRoutes, { prefix: "/api/v1/profiles" });
    // Healthcheck Route
    app.get("/health", async () => {
        return { status: "ok" };
    });
    return app;
};
exports.buildApp = buildApp;
// trigger restart
//# sourceMappingURL=app.js.map