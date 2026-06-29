import { getUsers, createUser, updateUser, deleteUser } from "../controllers/users.controller";
export const usersRoutes = async (fastify) => {
    fastify.addHook("onRequest", fastify.authenticate);
    fastify.get("/", getUsers);
    fastify.post("/", createUser);
    fastify.put("/:username", updateUser);
    fastify.delete("/:username", deleteUser);
};
//# sourceMappingURL=users.routes.js.map