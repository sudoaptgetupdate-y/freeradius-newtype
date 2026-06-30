import { getDictionary, createDictionaryAttribute, deleteDictionaryAttribute } from "../controllers/dictionary.controller";
const dictionaryRoutes = async (fastify, opts) => {
    fastify.addHook("onRequest", fastify.requireTenantAdmin);
    fastify.get("/", getDictionary);
    fastify.post("/", createDictionaryAttribute);
    fastify.delete("/", deleteDictionaryAttribute);
};
export default dictionaryRoutes;
//# sourceMappingURL=dictionary.routes.js.map