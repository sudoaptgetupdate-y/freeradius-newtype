"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const fastify_1 = require("fastify");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const dashboardRoutes = async (fastify) => {
    // Ensure the route is protected by JWT
    fastify.addHook("onRequest", fastify.authenticate);
    fastify.get("/stats", dashboard_controller_1.getDashboardStats);
    fastify.get("/logs/failed-logins", dashboard_controller_1.getFailedLogins);
};
exports.dashboardRoutes = dashboardRoutes;
//# sourceMappingURL=dashboard.routes.js.map