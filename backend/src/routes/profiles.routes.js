import { getProfiles, createProfile, deleteProfile, updateProfile } from "../controllers/profiles.controller";
export const profilesRoutes = async (fastify, opts) => {
    // All profile routes require at least tenant_admin role
    fastify.addHook("onRequest", fastify.requireTenantAdmin);
    fastify.get("/", getProfiles);
    fastify.post("/", createProfile);
    fastify.put("/", updateProfile);
    fastify.delete("/", deleteProfile);
};
//# sourceMappingURL=profiles.routes.js.map