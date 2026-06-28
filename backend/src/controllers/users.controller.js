"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const fastify_1 = require("fastify");
const db_1 = require("../db");
const freeradius_1 = require("../schema/freeradius");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const userSchema = zod_1.z.object({
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(4),
    profileName: zod_1.z.string().min(1),
    tenantId: zod_1.z.string().optional(),
});
const userUpdateSchema = zod_1.z.object({
    password: zod_1.z.string().min(4).optional(),
    profileName: zod_1.z.string().min(1).optional(),
});
const getUsers = async (request, reply) => {
    try {
        const user = request.user;
        // Get unique usernames from radcheck (filtering by password attribute to avoid duplicates if possible)
        let usersQuery = db_1.db
            .select({
            id: freeradius_1.radcheck.id,
            username: freeradius_1.radcheck.username,
            tenantId: freeradius_1.radcheck.tenantId,
        })
            .from(freeradius_1.radcheck)
            .where((0, drizzle_orm_1.eq)(freeradius_1.radcheck.attribute, 'Cleartext-Password'))
            .limit(50); // Hardcoded limit for now to prevent massive scans
        if (user.role !== 'super_admin') {
            usersQuery = db_1.db
                .select({
                id: freeradius_1.radcheck.id,
                username: freeradius_1.radcheck.username,
                tenantId: freeradius_1.radcheck.tenantId,
            })
                .from(freeradius_1.radcheck)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radcheck.attribute, 'Cleartext-Password'), (0, drizzle_orm_1.eq)(freeradius_1.radcheck.tenantId, user.tenantId)))
                .limit(50);
        }
        const radcheckUsers = await usersQuery;
        // Now for each user, check if they are online in radacct
        // This is a naive approach (N+1), but acceptable for a quick 50-limit list without complex subqueries
        const userList = await Promise.all(radcheckUsers.map(async (u) => {
            const activeSessionRes = await db_1.db
                .select({
                nasipaddress: freeradius_1.radacct.nasipaddress,
                framedipaddress: freeradius_1.radacct.framedipaddress,
                callingstationid: freeradius_1.radacct.callingstationid, // MAC Address usually
                acctinputoctets: freeradius_1.radacct.acctinputoctets,
                acctoutputoctets: freeradius_1.radacct.acctoutputoctets,
            })
                .from(freeradius_1.radacct)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radacct.username, u.username), (0, drizzle_orm_1.eq)(freeradius_1.radacct.tenantId, u.tenantId), (0, drizzle_orm_1.isNull)(freeradius_1.radacct.acctstoptime)))
                .limit(1);
            const activeSession = activeSessionRes[0];
            // Fetch user's profile
            const profileRes = await db_1.db.select().from(freeradius_1.radusergroup).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radusergroup.username, u.username), (0, drizzle_orm_1.eq)(freeradius_1.radusergroup.tenantId, u.tenantId))).limit(1);
            const profileName = profileRes.length > 0 ? profileRes[0].groupname : "Default";
            if (activeSession) {
                const download = Number(activeSession.acctoutputoctets || 0);
                const upload = Number(activeSession.acctinputoctets || 0);
                const usageMB = ((download + upload) / (1024 * 1024)).toFixed(2);
                return {
                    id: String(u.id),
                    username: u.username,
                    mac: activeSession.callingstationid || "-",
                    ip: activeSession.framedipaddress || "-",
                    dataUsage: `${usageMB} MB`,
                    status: "online",
                    isOnline: true,
                    profileName,
                    tenantId: u.tenantId,
                };
            }
            else {
                return {
                    id: String(u.id),
                    username: u.username,
                    mac: "-",
                    ip: "-",
                    dataUsage: "0 MB",
                    status: "offline",
                    isOnline: false,
                    profileName,
                    tenantId: u.tenantId,
                };
            }
        }));
        return reply.send({ users: userList });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
exports.getUsers = getUsers;
const createUser = async (request, reply) => {
    try {
        const user = request.user;
        const data = userSchema.parse(request.body);
        const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? data.tenantId : user.tenantId;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant ID is required" });
        }
        // Check duplicate
        const existing = await db_1.db.select().from(freeradius_1.radcheck).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radcheck.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radcheck.username, data.username))).limit(1);
        if (existing.length > 0) {
            return reply.status(409).send({ error: "Username already exists" });
        }
        // Insert into radcheck
        await db_1.db.insert(freeradius_1.radcheck).values({
            tenantId: targetTenantId,
            username: data.username,
            attribute: "Cleartext-Password",
            op: ":=",
            value: data.password
        });
        // Insert into radusergroup
        await db_1.db.insert(freeradius_1.radusergroup).values({
            tenantId: targetTenantId,
            username: data.username,
            groupname: data.profileName,
            priority: 1
        });
        reply.status(201).send({ message: "User created successfully" });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.errors });
        }
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
exports.createUser = createUser;
const updateUser = async (request, reply) => {
    try {
        const user = request.user;
        const { username } = request.params;
        const data = userUpdateSchema.parse(request.body);
        const query = request.query;
        const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? query.tenantId : user.tenantId;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant ID is required" });
        }
        if (data.password) {
            await db_1.db.update(freeradius_1.radcheck).set({ value: data.password }).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radcheck.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radcheck.username, username), (0, drizzle_orm_1.eq)(freeradius_1.radcheck.attribute, "Cleartext-Password")));
        }
        if (data.profileName) {
            await db_1.db.update(freeradius_1.radusergroup).set({ groupname: data.profileName }).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radusergroup.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radusergroup.username, username)));
        }
        reply.send({ message: "User updated successfully" });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (request, reply) => {
    try {
        const user = request.user;
        const { username } = request.params;
        const query = request.query;
        const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? query.tenantId : user.tenantId;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant ID is required" });
        }
        await db_1.db.delete(freeradius_1.radcheck).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radcheck.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radcheck.username, username)));
        await db_1.db.delete(freeradius_1.radusergroup).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(freeradius_1.radusergroup.tenantId, targetTenantId), (0, drizzle_orm_1.eq)(freeradius_1.radusergroup.username, username)));
        reply.send({ message: "User deleted successfully" });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=users.controller.js.map