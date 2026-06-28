"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRoutes = void 0;
const fastify_1 = require("fastify");
const users_controller_1 = require("../controllers/users.controller");
const usersRoutes = async (fastify) => {
    fastify.addHook("onRequest", fastify.authenticate);
    fastify.get("/", users_controller_1.getUsers);
    fastify.post("/", users_controller_1.createUser);
    fastify.put("/:username", users_controller_1.updateUser);
    fastify.delete("/:username", users_controller_1.deleteUser);
};
exports.usersRoutes = usersRoutes;
//# sourceMappingURL=users.routes.js.map