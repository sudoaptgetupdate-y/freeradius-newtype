"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const fastify_1 = require("fastify");
const db_1 = require("../db");
const admins_1 = require("../schema/admins");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const login = async (request, reply) => {
    try {
        const { email, password } = loginSchema.parse(request.body);
        const adminList = await db_1.db.select().from(admins_1.admins).where((0, drizzle_orm_1.eq)(admins_1.admins.email, email)).limit(1);
        if (adminList.length === 0) {
            return reply.code(401).send({ error: "Unauthorized", message: "Invalid email or password" });
        }
        const admin = adminList[0];
        const isPasswordValid = await bcrypt_1.default.compare(password, admin.passwordHash);
        if (!isPasswordValid) {
            return reply.code(401).send({ error: "Unauthorized", message: "Invalid email or password" });
        }
        // Generate JWT
        const token = await reply.jwtSign({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            tenantId: admin.tenantId,
        });
        return reply.send({
            message: "Login successful",
            token,
            user: {
                id: admin.id,
                email: admin.email,
                role: admin.role,
                tenantId: admin.tenantId,
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return reply.code(400).send({ error: "Bad Request", message: error.errors });
        }
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
exports.login = login;
//# sourceMappingURL=auth.controller.js.map