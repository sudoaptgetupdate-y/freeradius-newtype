"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNas = exports.updateNas = exports.createNas = exports.getNasList = void 0;
const fastify_1 = require("fastify");
const db_1 = require("../db");
const nas_1 = require("../schema/nas");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const nasSchema = zod_1.z.object({
    nasname: zod_1.z.string().max(128),
    shortname: zod_1.z.string().max(32),
    type: zod_1.z.string().max(30).default("other"),
    secret: zod_1.z.string().max(60),
    apiUsername: zod_1.z.string().max(255).optional(),
    apiPasswordEncrypted: zod_1.z.string().max(512).optional(),
    description: zod_1.z.string().max(200).optional(),
    tenantId: zod_1.z.string().uuid().optional(),
});
const getNasList = async (request, reply) => {
    try {
        const user = request.user;
        // Superadmin should view all NAS devices across all tenants.
        // Tenant Admin only views their own.
        let allNas;
        if (user.role === "super_admin" || user.role === "admin") {
            allNas = await db_1.db.select().from(nas_1.nas);
        }
        else {
            allNas = await db_1.db.select().from(nas_1.nas).where((0, drizzle_orm_1.eq)(nas_1.nas.tenantId, user.tenantId));
        }
        reply.send(allNas);
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Failed to fetch NAS devices" });
    }
};
exports.getNasList = getNasList;
const createNas = async (request, reply) => {
    try {
        const user = request.user;
        const data = nasSchema.parse(request.body);
        if (user.role === "super_admin" && !data.tenantId) {
            return reply.status(400).send({ error: "Validation error", message: "Super admin must provide a tenantId" });
        }
        const tenantIdToUse = user.role === "super_admin" ? data.tenantId : user.tenantId;
        // Check for duplicates
        const existingNas = await db_1.db.select().from(nas_1.nas).where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(nas_1.nas.nasname, data.nasname), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(nas_1.nas.shortname, data.shortname), (0, drizzle_orm_1.eq)(nas_1.nas.tenantId, tenantIdToUse)))).limit(1);
        if (existingNas.length > 0) {
            if (existingNas[0].nasname === data.nasname) {
                return reply.status(409).send({ error: "Conflict", message: "IP Address (NASName) already exists in the system" });
            }
            return reply.status(409).send({ error: "Conflict", message: "Shortname already exists in this tenant" });
        }
        const [newNas] = await db_1.db.insert(nas_1.nas).values({
            ...data,
            tenantId: tenantIdToUse
        }).returning();
        reply.status(201).send(newNas);
    }
    catch (error) {
        request.log.error(error);
        if (error instanceof zod_1.z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.errors });
        }
        reply.status(500).send({ error: "Failed to create NAS" });
    }
};
exports.createNas = createNas;
const updateNas = async (request, reply) => {
    try {
        const user = request.user;
        const { id } = request.params;
        const data = nasSchema.partial().parse(request.body);
        // Check for duplicates on update
        if (data.nasname || data.shortname) {
            const currentNasQuery = user.role === "super_admin" || user.role === "admin"
                ? (0, drizzle_orm_1.eq)(nas_1.nas.id, parseInt(id))
                : (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(nas_1.nas.id, parseInt(id)), (0, drizzle_orm_1.eq)(nas_1.nas.tenantId, user.tenantId));
            const currentNas = await db_1.db.select().from(nas_1.nas).where(currentNasQuery).limit(1);
            if (currentNas.length === 0) {
                return reply.status(404).send({ error: "NAS not found or access denied" });
            }
            const duplicateCheck = await db_1.db.select().from(nas_1.nas).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.not)((0, drizzle_orm_1.eq)(nas_1.nas.id, parseInt(id))), (0, drizzle_orm_1.or)(data.nasname ? (0, drizzle_orm_1.eq)(nas_1.nas.nasname, data.nasname) : undefined, data.shortname ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(nas_1.nas.shortname, data.shortname), (0, drizzle_orm_1.eq)(nas_1.nas.tenantId, currentNas[0].tenantId)) : undefined))).limit(1);
            if (duplicateCheck.length > 0) {
                if (data.nasname && duplicateCheck[0].nasname === data.nasname) {
                    return reply.status(409).send({ error: "Conflict", message: "IP Address (NASName) already exists in the system" });
                }
                return reply.status(409).send({ error: "Conflict", message: "Shortname already exists in this tenant" });
            }
        }
        const updateQuery = user.role === "super_admin" || user.role === "admin"
            ? (0, drizzle_orm_1.eq)(nas_1.nas.id, parseInt(id))
            : (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(nas_1.nas.id, parseInt(id)), (0, drizzle_orm_1.eq)(nas_1.nas.tenantId, user.tenantId));
        const [updatedNas] = await db_1.db
            .update(nas_1.nas)
            .set({ ...data, updatedAt: new Date() })
            .where(updateQuery)
            .returning();
        if (!updatedNas) {
            return reply.status(404).send({ error: "NAS not found or access denied" });
        }
        reply.send(updatedNas);
    }
    catch (error) {
        request.log.error(error);
        if (error instanceof zod_1.z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.errors });
        }
        reply.status(500).send({ error: "Failed to update NAS" });
    }
};
exports.updateNas = updateNas;
const deleteNas = async (request, reply) => {
    try {
        const user = request.user;
        const { id } = request.params;
        // NAS deletion is usually a hard delete, or we might need soft delete if we want to keep acct records?
        // According to SKILL.md, core entities with relations (like NAS used in radacct via nasipaddress) 
        // Wait, FreeRADIUS radacct uses `nasipaddress` string, not `nas.id`. So deleting NAS doesn't break radacct FKs.
        // We will do a hard delete for NAS since it's just the authentication configuration for FreeRADIUS.
        const deleteQuery = user.role === "super_admin" || user.role === "admin"
            ? (0, drizzle_orm_1.eq)(nas_1.nas.id, parseInt(id))
            : (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(nas_1.nas.id, parseInt(id)), (0, drizzle_orm_1.eq)(nas_1.nas.tenantId, user.tenantId));
        const [deletedNas] = await db_1.db
            .delete(nas_1.nas)
            .where(deleteQuery)
            .returning();
        if (!deletedNas) {
            return reply.status(404).send({ error: "NAS not found or access denied" });
        }
        reply.send({ success: true, message: "NAS deleted" });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Failed to delete NAS" });
    }
};
exports.deleteNas = deleteNas;
//# sourceMappingURL=nas.controller.js.map