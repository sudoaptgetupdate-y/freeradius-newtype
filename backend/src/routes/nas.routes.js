"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nasRoutes = void 0;
const fastify_1 = require("fastify");
const nas_controller_1 = require("../controllers/nas.controller");
const nasRoutes = async (fastify) => {
    // NAS routes require at least tenant admin
    fastify.addHook("onRequest", fastify.requireTenantAdmin);
    fastify.get("/", nas_controller_1.getNasList);
    fastify.post("/", nas_controller_1.createNas);
    fastify.put("/:id", nas_controller_1.updateNas);
    fastify.delete("/:id", nas_controller_1.deleteNas);
};
exports.nasRoutes = nasRoutes;
//# sourceMappingURL=nas.routes.js.map