"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const fastify_1 = require("fastify");
const auth_controller_1 = require("../controllers/auth.controller");
const zod_1 = require("zod");
async function authRoutes(fastify) {
    fastify.post("/login", {
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
                password: zod_1.z.string(),
            }),
        },
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute'
            }
        }
    }, auth_controller_1.login);
    // Example of a protected route
    fastify.get("/me", { preValidation: [fastify.authenticate] }, async (request, reply) => {
        return request.user;
    });
}
//# sourceMappingURL=auth.routes.js.map