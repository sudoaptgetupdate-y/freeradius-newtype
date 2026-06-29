import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { getSettings, updateSettings, settingsSchema } from "../controllers/settings.controller";

export const settingsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // All settings routes require authentication
  app.addHook("preHandler", app.authenticate);

  app.get("/", getSettings);

  app.put("/", {
    schema: {
      body: settingsSchema,
    },
  }, updateSettings);
};

export default settingsRoutes;
