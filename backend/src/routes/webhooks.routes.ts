import type { FastifyInstance } from "fastify";
import { handleTelegramWebhook } from "../controllers/webhooks.controller";

export default async function webhooksRoutes(app: FastifyInstance) {
  app.post("/pms", async (request, reply) => {
    // TODO: Implement PMS Webhook Integration
    return reply.send({ message: "Webhook received" });
  });

  app.post("/payments", async (request, reply) => {
    // TODO: Implement Payment Gateway Webhook (PromptPay/Stripe)
    return reply.send({ message: "Payment webhook received" });
  });

  app.post("/telegram/:token", handleTelegramWebhook);
}
