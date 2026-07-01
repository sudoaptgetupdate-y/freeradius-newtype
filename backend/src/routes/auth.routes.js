import { login, impersonate, exitImpersonate } from "../controllers/auth.controller";
import { socialLoginRedirect, socialLoginCallback } from "../controllers/social-auth.controller";
import { loginSchema } from "../services/auth.service";
export default async function authRoutes(app) {
    const fastify = app.withTypeProvider();
    fastify.post("/login", {
        schema: {
            body: loginSchema,
            response: {
            // We can define 200 response schema here later
            }
        }
    }, login);
    fastify.post("/logout", async (request, reply) => {
        reply.clearCookie("token", { path: "/" });
        return reply.send({ message: "Logout successful" });
    });
    // Impersonation: Super Admin only
    fastify.post("/impersonate", {
        onRequest: [fastify.requireSuperAdmin],
    }, impersonate);
    // Exit impersonation: any authenticated user
    fastify.post("/exit-impersonate", {
        onRequest: [fastify.authenticate],
    }, exitImpersonate);
    // --- Social Login Routes (Public) ---
    fastify.get("/:tenantId/social-auth/:provider", socialLoginRedirect);
    fastify.get("/social/callback/:provider", socialLoginCallback);
}
//# sourceMappingURL=auth.routes.js.map