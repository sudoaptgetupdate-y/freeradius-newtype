import type { FastifyInstance } from "fastify";
import { login, impersonate, exitImpersonate } from "../controllers/auth.controller";
import { loginSchema } from "../services/auth.service";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export default async function authRoutes(app: FastifyInstance) {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  
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
}
