"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTenant = exports.updateTenant = exports.createTenant = exports.getTenants = void 0;
const fastify_1 = require("fastify");
const db_1 = require("../db");
const tenants_1 = require("../schema/tenants");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const admins_1 = require("../schema/admins");
const tenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    maxUsers: zod_1.z.number().min(1).default(100),
    maxNas: zod_1.z.number().min(1).default(1),
    status: zod_1.z.enum(["active", "suspended"]).default("active"),
    allowLogAccess: zod_1.z.boolean().default(false),
    telegramChatId: zod_1.z.string().max(100).optional(),
    telegramEnabled: zod_1.z.boolean().default(false),
    adminEmail: zod_1.z.string().email().optional(),
    adminPassword: zod_1.z.string().min(1).optional(),
});
const getTenants = async (request, reply) => {
    try {
        const allTenants = await db_1.db.select().from(tenants_1.tenants);
        reply.send(allTenants);
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Failed to fetch tenants" });
    }
};
exports.getTenants = getTenants;
const createTenant = async (request, reply) => {
    try {
        const data = tenantSchema.parse(request.body);
        // Separate tenant data and admin data
        const { adminEmail, adminPassword, ...tenantData } = data;
        // Use transaction to ensure both are created
        const newTenant = await db_1.db.transaction(async (tx) => {
            const [insertedTenant] = await tx.insert(tenants_1.tenants).values(tenantData).returning();
            if (adminEmail && adminPassword) {
                // Check if admin email already exists
                const existingAdmin = await tx.select().from(admins_1.admins).where((0, drizzle_orm_1.eq)(admins_1.admins.email, adminEmail)).limit(1);
                if (existingAdmin.length > 0) {
                    throw new Error("Admin email already exists");
                }
                const passwordHash = await bcrypt_1.default.hash(adminPassword, 10);
                await tx.insert(admins_1.admins).values({
                    email: adminEmail,
                    passwordHash,
                    role: "tenant_admin",
                    tenantId: insertedTenant.id,
                });
            }
            return insertedTenant;
        });
        reply.status(201).send(newTenant);
    }
    catch (error) {
        request.log.error(error);
        if (error instanceof zod_1.z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.errors });
        }
        if (error.message === "Admin email already exists") {
            return reply.status(409).send({ error: "Admin email already exists" });
        }
        reply.status(500).send({ error: "Failed to create tenant" });
    }
};
exports.createTenant = createTenant;
const updateTenant = async (request, reply) => {
    try {
        const { id } = request.params;
        const data = tenantSchema.partial().parse(request.body);
        const [updatedTenant] = await db_1.db
            .update(tenants_1.tenants)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(tenants_1.tenants.id, id))
            .returning();
        if (!updatedTenant) {
            return reply.status(404).send({ error: "Tenant not found" });
        }
        reply.send(updatedTenant);
    }
    catch (error) {
        request.log.error(error);
        if (error instanceof zod_1.z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.errors });
        }
        reply.status(500).send({ error: "Failed to update tenant" });
    }
};
exports.updateTenant = updateTenant;
const deleteTenant = async (request, reply) => {
    try {
        const { id } = request.params;
        // Soft delete: set status to suspended
        const [deletedTenant] = await db_1.db
            .update(tenants_1.tenants)
            .set({ status: "suspended", updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(tenants_1.tenants.id, id))
            .returning();
        if (!deletedTenant) {
            return reply.status(404).send({ error: "Tenant not found" });
        }
        reply.send({ success: true, message: "Tenant suspended" });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Failed to delete tenant" });
    }
};
exports.deleteTenant = deleteTenant;
//# sourceMappingURL=tenants.controller.js.map