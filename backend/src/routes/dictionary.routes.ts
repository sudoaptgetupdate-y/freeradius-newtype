import type { FastifyPluginAsync } from "fastify";
import { getDictionary, createDictionaryAttribute, deleteDictionaryAttribute } from "../controllers/dictionary.controller";

const dictionaryRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.addHook("onRequest", fastify.requireTenantAdmin);

  fastify.get("/", getDictionary);
  fastify.post("/", createDictionaryAttribute);
  fastify.delete("/", deleteDictionaryAttribute);
};

export default dictionaryRoutes;
