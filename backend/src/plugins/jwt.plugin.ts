import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyRequest, FastifyReply } from "fastify";

export default fp(async (fastify) => {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "super-secret-default-key-change-in-prod",
  });

  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
  });

  fastify.decorate("requireSuperAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      if (user.role !== "super_admin") {
        reply.code(403).send({ error: "Forbidden", message: "Super Admin access required" });
      }
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
  });

  fastify.decorate("requireTenantAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      if (user.role !== "tenant_admin" && user.role !== "super_admin") {
        reply.code(403).send({ error: "Forbidden", message: "Tenant Admin access required" });
      }
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
  });
});

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireSuperAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireTenantAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
