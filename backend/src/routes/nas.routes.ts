import { FastifyInstance } from "fastify";
import { getNasList, createNas, updateNas, deleteNas } from "../controllers/nas.controller";

export const nasRoutes = async (fastify: FastifyInstance) => {
  // NAS routes require at least tenant admin
  fastify.addHook("onRequest", fastify.requireTenantAdmin);

  fastify.get("/", getNasList);
  fastify.post("/", createNas);
  fastify.put("/:id", updateNas);
  fastify.delete("/:id", deleteNas);
};
