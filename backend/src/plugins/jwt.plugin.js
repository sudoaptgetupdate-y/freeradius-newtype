import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
export default fp(async (fastify) => {
    fastify.register(jwt, {
        secret: process.env.JWT_SECRET || "super-secret-default-key-change-in-prod",
    });
    fastify.decorate("authenticate", async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            return reply.code(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
        }
    });
    fastify.decorate("requireSuperAdmin", async (request, reply) => {
        try {
            await request.jwtVerify();
            const user = request.user;
            if (user.role !== "super_admin") {
                return reply.code(403).send({ error: "Forbidden", message: "Super Admin access required" });
            }
        }
        catch (err) {
            return reply.code(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
        }
    });
    fastify.decorate("requireTenantAdmin", async (request, reply) => {
        try {
            await request.jwtVerify();
            const user = request.user;
            if (user.role !== "tenant_admin" && user.role !== "super_admin") {
                return reply.code(403).send({ error: "Forbidden", message: "Tenant Admin access required" });
            }
        }
        catch (err) {
            return reply.code(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
        }
    });
});
//# sourceMappingURL=jwt.plugin.js.map