"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profilesRoutes = void 0;
const fastify_1 = require("fastify");
const profiles_controller_1 = require("../controllers/profiles.controller");
const profilesRoutes = async (fastify, opts) => {
    // All profile routes require at least tenant_admin role
    fastify.addHook("onRequest", fastify.requireTenantAdmin);
    fastify.get("/", profiles_controller_1.getProfiles);
    fastify.post("/", profiles_controller_1.createProfile);
    fastify.put("/", profiles_controller_1.updateProfile);
    fastify.delete("/", profiles_controller_1.deleteProfile);
};
exports.profilesRoutes = profilesRoutes;
//# sourceMappingURL=profiles.routes.js.map