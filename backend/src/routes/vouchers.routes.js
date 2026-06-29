export default async function vouchersRoutes(app) {
    const fastify = app.withTypeProvider();
    fastify.post("/generate", async (request, reply) => {
        // TODO: Implement background job for voucher generation (Redis/BullMQ)
        return reply.code(202).send({ message: "Job accepted", jobId: "temp-job-123" });
    });
}
//# sourceMappingURL=vouchers.routes.js.map