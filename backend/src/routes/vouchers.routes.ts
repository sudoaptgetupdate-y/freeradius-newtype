import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export default async function vouchersRoutes(app: FastifyInstance) {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  
  fastify.post("/generate", async (request, reply) => {
    // TODO: Implement background job for voucher generation (Redis/BullMQ)
    return reply.code(202).send({ message: "Job accepted", jobId: "temp-job-123" });
  });
}
