import type { FastifyInstance } from "fastify";
import { getNasList, createNas, updateNas, deleteNas, getNasStatus, getNasDhcp, kickNasUser } from "../controllers/nas.controller";

export const nasRoutes = async (fastify: FastifyInstance) => {
  // NAS routes require at least tenant admin
  fastify.addHook("onRequest", fastify.requireTenantAdmin);

  fastify.get("/", getNasList);
  fastify.post("/", createNas);
  fastify.put("/:id", updateNas);
  fastify.delete("/:id", deleteNas);
  
  // Mikrotik API & CoA Routes
  fastify.get("/:id/status", getNasStatus);
  fastify.get("/:id/dhcp", getNasDhcp);
  fastify.post("/:id/kick", kickNasUser);
};
