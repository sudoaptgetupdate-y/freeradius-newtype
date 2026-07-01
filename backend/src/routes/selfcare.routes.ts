import type { FastifyInstance } from "fastify";
import {
  selfCareLogin,
  getSelfCareProfile,
  getActiveSessions,
  getSessionHistory,
  disconnectSession,
  changePassword,
} from "../controllers/selfcare.controller";

export default async function selfcareRoutes(fastify: FastifyInstance) {
  // Public Login Route
  fastify.post("/auth/login", selfCareLogin);

  // Protected Routes (Require end_user JWT)
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", fastify.authenticate);

    protectedRoutes.get("/me", getSelfCareProfile);
    protectedRoutes.get("/sessions/active", getActiveSessions);
    protectedRoutes.get("/sessions/history", getSessionHistory);
    protectedRoutes.post("/sessions/disconnect", disconnectSession);
    protectedRoutes.put("/password", changePassword);
  });
}
