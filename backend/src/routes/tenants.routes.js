"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantsRoutes = void 0;
const fastify_1 = require("fastify");
const tenants_controller_1 = require("../controllers/tenants.controller");
const tenantsRoutes = async (fastify) => {
    // All tenant routes require superadmin
    fastify.addHook("onRequest", fastify.requireSuperAdmin);
    fastify.get("/", tenants_controller_1.getTenants);
    fastify.post("/", tenants_controller_1.createTenant);
    fastify.put("/:id", tenants_controller_1.updateTenant);
    fastify.delete("/:id", tenants_controller_1.deleteTenant);
};
exports.tenantsRoutes = tenantsRoutes;
//# sourceMappingURL=tenants.routes.js.map