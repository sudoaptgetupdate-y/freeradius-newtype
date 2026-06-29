import type { FastifyInstance } from "fastify";
import { getDashboardStats, getFailedLogins } from "../controllers/dashboard.controller";

export const dashboardRoutes = async (fastify: FastifyInstance) => {
  // Ensure the route is protected by JWT
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/stats", getDashboardStats);
  fastify.get("/logs/failed-logins", getFailedLogins);
};
