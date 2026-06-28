import { FastifyInstance } from "fastify";
import { login } from "../controllers/auth.controller";
import { z } from "zod";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/login",
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      },
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute'
        }
      }
    },
    login
  );

  // Example of a protected route
  fastify.get("/me", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    return request.user;
  });
}
