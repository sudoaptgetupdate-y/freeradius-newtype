"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfile = exports.updateProfile = exports.createProfile = exports.getProfiles = void 0;
const fastify_1 = require("fastify");
const db_1 = require("../db");
const freeradius_1 = require("../schema/freeradius");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const profileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Profile name is required"),
    downloadSpeed: zod_1.z.string().optional(), // e.g. "10M"
    uploadSpeed: zod_1.z.string().optional(), // e.g. "10M"
    sessionTimeout: zod_1.z.number().optional(), // in seconds
    sharedUsers: zod_1.z.number().optional(), // Simultaneous-Use
    tenantId: zod_1.z.string().optional(), // Required if super admin
});
const updateProfileSchema = profileSchema.extend({
    oldName: zod_1.z.string().min(1, "Old profile name is required"),
});
const getProfiles = async (request, reply) => {
    try {
        const user = request.user;
        // Fetch all attributes for this tenant
        let replyAttrs, checkAttrs;
        if (user.role === "super_admin" || user.role === "admin") {
            replyAttrs = await db_1.db.select().from(freeradius_1.radgroupreply);
            checkAttrs = await db_1.db.select().from(freeradius_1.radgroupcheck);
        }
        else {
            replyAttrs = await db_1.db.select().from(freeradius_1.radgroupreply).where((0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.tenantId, user.tenantId));
            checkAttrs = await db_1.db.select().from(freeradius_1.radgroupcheck).where((0, drizzle_orm_1.eq)(freeradius_1.radgroupcheck.tenantId, user.tenantId));
        }
        // Group by groupname
        const profilesMap = new Map();
        const initProfile = (name, tenantId) => {
            // Use tenantId + name as composite key for map if super admin, but returning list just needs to include tenantId
            const key = `${tenantId}_${name}`;
            if (!profilesMap.has(key)) {
                profilesMap.set(key, {
                    name,
                    tenantId,
                    downloadSpeed: "",
                    uploadSpeed: "",
                    sessionTimeout: null,
                    sharedUsers: null
                });
            }
            return profilesMap.get(key);
        };
        // Process radgroupreply
        replyAttrs.forEach(row => {
            const p = initProfile(row.groupname, row.tenantId);
            if (row.attribute === "Mikrotik-Rate-Limit") {
                // Mikrotik format: rx/tx e.g. 10M/10M (Upload/Download)
                const parts = row.value.split("/");
                if (parts.length === 2) {
                    p.uploadSpeed = parts[0];
                    p.downloadSpeed = parts[1];
                }
            }
        });
        // Process radgroupcheck
        checkAttrs.forEach(row => {
            const p = initProfile(row.groupname, row.tenantId);
            if (row.attribute === "Simultaneous-Use") {
                p.sharedUsers = parseInt(row.value, 10);
            }
            else if (row.attribute === "Session-Timeout") {
                p.sessionTimeout = parseInt(row.value, 10);
            }
        });
        const profilesList = Array.from(profilesMap.values());
        reply.send(profilesList);
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
exports.getProfiles = getProfiles;
const createProfile = async (request, reply) => {
    try {
        const user = request.user;
        const data = profileSchema.parse(request.body);
        const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? data.tenantId : user.tenantId;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant ID is required" });
        }
        // Check if profile exists
        const existing = await db_1.db.select().from(freeradius_1.radgroupreply).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.groupname, data.name))).limit(1);
        if (existing.length > 0) {
            return reply.status(409).send({ error: "Profile name already exists for this tenant" });
        }
        // Prepare inserts
        if (data.downloadSpeed && data.uploadSpeed) {
            await db_1.db.insert(freeradius_1.radgroupreply).values({
                tenantId: targetTenantId,
                groupname: data.name,
                attribute: "Mikrotik-Rate-Limit",
                op: "=",
                value: `${data.uploadSpeed}/${data.downloadSpeed}`
            });
        }
        if (data.sharedUsers) {
            await db_1.db.insert(freeradius_1.radgroupcheck).values({
                tenantId: targetTenantId,
                groupname: data.name,
                attribute: "Simultaneous-Use",
                op: ":=",
                value: data.sharedUsers.toString()
            });
        }
        if (data.sessionTimeout) {
            await db_1.db.insert(freeradius_1.radgroupcheck).values({
                tenantId: targetTenantId,
                groupname: data.name,
                attribute: "Session-Timeout",
                op: ":=",
                value: data.sessionTimeout.toString()
            });
        }
        reply.status(201).send({ message: "Profile created successfully" });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.errors });
        }
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
exports.createProfile = createProfile;
const updateProfile = async (request, reply) => {
    try {
        const user = request.user;
        const data = updateProfileSchema.parse(request.body);
        const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? data.tenantId : user.tenantId;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant ID is required" });
        }
        // Ensure the old profile exists
        const existing = await db_1.db.select().from(freeradius_1.radgroupreply).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.groupname, data.oldName))).limit(1);
        if (existing.length === 0) {
            return reply.status(404).send({ error: "Profile not found" });
        }
        // If name is changing, ensure new name doesn't exist
        if (data.name !== data.oldName) {
            const nameConflict = await db_1.db.select().from(freeradius_1.radgroupreply).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.groupname, data.name))).limit(1);
            if (nameConflict.length > 0) {
                return reply.status(409).send({ error: "New profile name already exists" });
            }
        }
        // Start transaction or simply perform multiple updates
        await db_1.db.transaction(async (tx) => {
            // 1. Delete all existing attributes for this group in radgroupcheck and radgroupreply
            await tx.delete(freeradius_1.radgroupreply).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.groupname, data.oldName)));
            await tx.delete(freeradius_1.radgroupcheck).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radgroupcheck.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radgroupcheck.groupname, data.oldName)));
            // 2. Insert new attributes with the (potentially new) name
            if (data.downloadSpeed && data.uploadSpeed) {
                await tx.insert(freeradius_1.radgroupreply).values({
                    tenantId: targetTenantId,
                    groupname: data.name,
                    attribute: "Mikrotik-Rate-Limit",
                    op: "=",
                    value: `${data.uploadSpeed}/${data.downloadSpeed}`
                });
            }
            if (data.sharedUsers) {
                await tx.insert(freeradius_1.radgroupcheck).values({
                    tenantId: targetTenantId,
                    groupname: data.name,
                    attribute: "Simultaneous-Use",
                    op: ":=",
                    value: data.sharedUsers.toString()
                });
            }
            if (data.sessionTimeout) {
                await tx.insert(freeradius_1.radgroupcheck).values({
                    tenantId: targetTenantId,
                    groupname: data.name,
                    attribute: "Session-Timeout",
                    op: ":=",
                    value: data.sessionTimeout.toString()
                });
            }
            // 3. Update radusergroup if the name has changed
            if (data.name !== data.oldName) {
                await tx.update(freeradius_1.radusergroup)
                    .set({ groupname: data.name })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radusergroup.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radusergroup.groupname, data.oldName)));
            }
        });
        reply.send({ message: "Profile updated successfully" });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.errors });
        }
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
exports.updateProfile = updateProfile;
const deleteProfile = async (request, reply) => {
    try {
        const user = request.user;
        const query = request.query;
        if (!query.name) {
            return reply.status(400).send({ error: "Profile name is required in query" });
        }
        const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? query.tenantId : user.tenantId;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant ID is required to delete a profile" });
        }
        // Check if profile is being used by any users
        const usersInGroup = await db_1.db.select().from(freeradius_1.radusergroup).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radusergroup.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radusergroup.groupname, query.name))).limit(1);
        if (usersInGroup.length > 0) {
            return reply.status(400).send({ error: "Cannot delete profile because it is currently assigned to users. Please reassign or delete the users first." });
        }
        await db_1.db.delete(freeradius_1.radgroupreply).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radgroupreply.groupname, query.name)));
        await db_1.db.delete(freeradius_1.radgroupcheck).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radgroupcheck.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radgroupcheck.groupname, query.name)));
        reply.send({ message: "Profile deleted successfully" });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
exports.deleteProfile = deleteProfile;
//# sourceMappingURL=profiles.controller.js.map