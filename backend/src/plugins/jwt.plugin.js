"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const fastify_1 = require("fastify");
exports.default = (0, fastify_plugin_1.default)(async (fastify) => {
    fastify.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || "super-secret-default-key-change-in-prod",
    });
    fastify.decorate("authenticate", async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.code(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
        }
    });
    fastify.decorate("requireSuperAdmin", async (request, reply) => {
        try {
            await request.jwtVerify();
            const user = request.user;
            if (user.role !== "super_admin") {
                reply.code(403).send({ error: "Forbidden", message: "Super Admin access required" });
            }
        }
        catch (err) {
            reply.code(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
        }
    });
    fastify.decorate("requireTenantAdmin", async (request, reply) => {
        try {
            await request.jwtVerify();
            const user = request.user;
            if (user.role !== "tenant_admin" && user.role !== "super_admin") {
                reply.code(403).send({ error: "Forbidden", message: "Tenant Admin access required" });
            }
        }
        catch (err) {
            reply.code(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
        }
    });
});
//# sourceMappingURL=jwt.plugin.js.map