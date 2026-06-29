import { getTenants, createTenant, updateTenant, deleteTenant } from "../controllers/tenants.controller";
export const tenantsRoutes = async (fastify) => {
    // All tenant routes require superadmin
    fastify.addHook("onRequest", fastify.requireSuperAdmin);
    fastify.get("/", getTenants);
    fastify.post("/", createTenant);
    fastify.put("/:id", updateTenant);
    fastify.delete("/:id", deleteTenant);
};
//# sourceMappingURL=tenants.routes.js.map