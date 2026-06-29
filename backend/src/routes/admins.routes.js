import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from "../controllers/admins.controller";
export const adminsRoutes = async (fastify, opts) => {
    // All admins routes require at least tenant_admin role
    fastify.addHook("onRequest", fastify.requireTenantAdmin);
    fastify.get("/", getAdmins);
    fastify.post("/", createAdmin);
    fastify.put("/:id", updateAdmin);
    fastify.delete("/:id", deleteAdmin);
};
//# sourceMappingURL=admins.routes.js.map