import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { getSettings, updateSettings, settingsSchema, syncTelegramWebhook } from "../controllers/settings.controller";

export const settingsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // All settings routes require authentication
  app.addHook("preHandler", app.authenticate);

  app.get("/", getSettings);

  app.put("/", {
    schema: {
      body: settingsSchema,
    },
  }, updateSettings);

  app.post("/telegram/sync-webhook", syncTelegramWebhook);
};

export default settingsRoutes;
