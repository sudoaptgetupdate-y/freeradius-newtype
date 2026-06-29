import { login } from "../controllers/auth.controller";
import { loginSchema } from "../services/auth.service";
export default async function authRoutes(app) {
    const fastify = app.withTypeProvider();
    fastify.post("/login", {
        schema: {
            body: loginSchema,
            response: {
            // We can define 200 response schema here later
            }
        }
    }, login);
    fastify.post("/logout", async (request, reply) => {
        reply.clearCookie("token", { path: "/" });
        return reply.send({ message: "Logout successful" });
    });
}
//# sourceMappingURL=auth.routes.js.map