import { db } from "../db";
import { radcheck, radacct, radusergroup } from "../schema/freeradius";
import { eq, and, isNull, not, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { organizations, userOrganizations } from "../schema/organizations";
const userSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(4),
    profileName: z.string().min(1).optional(),
    groupId: z.string().uuid().optional(),
    tenantId: z.string().optional(),
});
const userUpdateSchema = z.object({
    password: z.string().min(4).optional(),
    profileName: z.string().min(1).optional(),
    groupId: z.string().uuid().optional().nullable(),
});
export const getUsers = async (request, reply) => {
    try {
        const user = request.user;
        // Use tenantId from JWT directly. This handles all cases:
        // - Tenant Admin: tenantId = their own UUID
        // - Super Admin (impersonating): tenantId = target tenant UUID
        // - Super Admin (normal): tenantId = null → show all
        const effectiveTenantId = user.tenantId ?? null;
        const baseCondition = eq(radcheck.attribute, 'Cleartext-Password');
        const whereCondition = effectiveTenantId
            ? and(baseCondition, eq(radcheck.tenantId, effectiveTenantId))
            : baseCondition;
        const radcheckUsers = await db
            .select({
            id: radcheck.id,
            username: radcheck.username,
            tenantId: radcheck.tenantId,
        })
            .from(radcheck)
            .where(whereCondition)
            .limit(50);
        const userList = await Promise.all(radcheckUsers.map(async (u) => {
            // 1. Check if user is currently online (has session with no stop time)
            const activeSessionRes = await db
                .select({
                radacctid: radacct.radacctid,
                framedipaddress: radacct.framedipaddress,
                callingstationid: radacct.callingstationid,
                acctinputoctets: radacct.acctinputoctets,
                acctoutputoctets: radacct.acctoutputoctets,
            })
                .from(radacct)
                .where(and(eq(radacct.username, u.username), eq(radacct.tenantId, u.tenantId), isNull(radacct.acctstoptime)))
                .limit(1);
            const activeSession = activeSessionRes[0];
            const isOnline = !!activeSession;
            // 2. Fetch last known session (most recent session overall)
            const lastSessionRes = await db
                .select({
                framedipaddress: radacct.framedipaddress,
                callingstationid: radacct.callingstationid,
                acctinputoctets: radacct.acctinputoctets,
                acctoutputoctets: radacct.acctoutputoctets,
            })
                .from(radacct)
                .where(and(eq(radacct.username, u.username), eq(radacct.tenantId, u.tenantId)))
                .orderBy(desc(radacct.acctstarttime))
                .limit(1);
            const lastSession = lastSessionRes[0];
            // 3. Calculate data usage (use active session if online, last session if offline)
            const targetSession = isOnline ? activeSession : lastSession;
            let usageMB = "0.00";
            if (targetSession) {
                const download = Number(targetSession.acctoutputoctets || 0);
                const upload = Number(targetSession.acctinputoctets || 0);
                usageMB = ((download + upload) / (1024 * 1024)).toFixed(2);
            }
            // Fetch user's profile
            const profileRes = await db.select().from(radusergroup).where(and(eq(radusergroup.username, u.username), eq(radusergroup.tenantId, u.tenantId))).limit(1);
            const profileName = profileRes.length > 0 ? profileRes[0].groupname : "Default";
            // Fetch user's group
            const groupRes = await db.select({
                id: organizations.id,
                name: organizations.name
            })
                .from(userOrganizations)
                .innerJoin(organizations, eq(userOrganizations.organizationId, organizations.id))
                .where(and(eq(userOrganizations.username, u.username), eq(userOrganizations.tenantId, u.tenantId))).limit(1);
            const group = groupRes.length > 0 ? groupRes[0] : null;
            return {
                id: String(u.id),
                username: u.username,
                mac: lastSession?.callingstationid || "-",
                ip: lastSession?.framedipaddress || "-",
                dataUsage: `${usageMB} MB`,
                status: isOnline ? "online" : "offline",
                isOnline,
                profileName,
                groupName: group?.name || "-",
                groupId: group?.id || null,
                tenantId: u.tenantId,
            };
        }));
        return reply.send({ users: userList });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
export const createUser = async (request, reply) => {
    try {
        const user = request.user;
        const data = userSchema.parse(request.body);
        // tenantId comes exclusively from JWT — this enforces tenant scope for both
        // regular Tenant Admins and impersonating Super Admins
        const targetTenantId = user.tenantId ?? null;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant context is required. Super Admin must impersonate a tenant first." });
        }
        // Check duplicate
        const existing = await db.select().from(radcheck).where(and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, data.username))).limit(1);
        if (existing.length > 0) {
            return reply.status(409).send({ error: "Username already exists" });
        }
        // Insert into radcheck
        await db.insert(radcheck).values({
            tenantId: targetTenantId,
            username: data.username,
            attribute: "Cleartext-Password",
            op: ":=",
            value: data.password
        });
        // Resolve Profile from Group if provided
        let finalProfileName = data.profileName;
        if (data.groupId) {
            const groupRes = await db.select().from(organizations).where(and(eq(organizations.id, data.groupId), eq(organizations.tenantId, targetTenantId))).limit(1);
            if (groupRes.length > 0 && groupRes[0].defaultProfile) {
                finalProfileName = groupRes[0].defaultProfile;
            }
        }
        if (!finalProfileName) {
            return reply.status(400).send({ error: "Either profileName or a valid groupId with a defaultProfile is required." });
        }
        // Insert into radusergroup
        await db.insert(radusergroup).values({
            tenantId: targetTenantId,
            username: data.username,
            groupname: finalProfileName,
            priority: 1
        });
        // Insert into userOrganizations if groupId provided
        if (data.groupId) {
            await db.insert(userOrganizations).values({
                tenantId: targetTenantId,
                username: data.username,
                organizationId: data.groupId,
            });
        }
        reply.status(201).send({ message: "User created successfully" });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.issues });
        }
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
export const updateUser = async (request, reply) => {
    try {
        const user = request.user;
        const { username } = request.params;
        const data = userUpdateSchema.parse(request.body);
        const targetTenantId = user.tenantId || request.query.tenantId || null;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant context is required. Super Admin must provide a tenantId." });
        }
        if (data.password) {
            await db.update(radcheck).set({ value: data.password }).where(and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, username), eq(radcheck.attribute, "Cleartext-Password")));
        }
        if (data.profileName) {
            await db.update(radusergroup).set({ groupname: data.profileName }).where(and(eq(radusergroup.tenantId, targetTenantId), eq(radusergroup.username, username)));
        }
        if (data.groupId !== undefined) {
            if (data.groupId === null) {
                await db.delete(userOrganizations).where(and(eq(userOrganizations.tenantId, targetTenantId), eq(userOrganizations.username, username)));
            }
            else {
                // Upsert group mapping
                const existingMapping = await db.select().from(userOrganizations).where(and(eq(userOrganizations.tenantId, targetTenantId), eq(userOrganizations.username, username))).limit(1);
                if (existingMapping.length > 0) {
                    await db.update(userOrganizations).set({ organizationId: data.groupId }).where(and(eq(userOrganizations.tenantId, targetTenantId), eq(userOrganizations.username, username)));
                }
                else {
                    await db.insert(userOrganizations).values({
                        tenantId: targetTenantId,
                        username: username,
                        organizationId: data.groupId,
                    });
                }
                // Optionally update profile based on new group if profileName was not explicitly provided
                if (!data.profileName) {
                    const groupRes = await db.select().from(organizations).where(and(eq(organizations.id, data.groupId), eq(organizations.tenantId, targetTenantId))).limit(1);
                    if (groupRes.length > 0 && groupRes[0].defaultProfile) {
                        await db.update(radusergroup).set({ groupname: groupRes[0].defaultProfile }).where(and(eq(radusergroup.tenantId, targetTenantId), eq(radusergroup.username, username)));
                    }
                }
            }
        }
        reply.send({ message: "User updated successfully" });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
export const deleteUser = async (request, reply) => {
    try {
        const user = request.user;
        const { username } = request.params;
        const targetTenantId = user.tenantId || request.query.tenantId || null;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant context is required. Super Admin must provide a tenantId." });
        }
        await db.delete(radcheck).where(and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, username)));
        await db.delete(radusergroup).where(and(eq(radusergroup.tenantId, targetTenantId), eq(radusergroup.username, username)));
        await db.delete(userOrganizations).where(and(eq(userOrganizations.tenantId, targetTenantId), eq(userOrganizations.username, username)));
        reply.send({ message: "User deleted successfully" });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
export const getUserDetails = async (request, reply) => {
    try {
        const authUser = request.user;
        const { username } = request.params;
        const targetTenantId = authUser.tenantId || request.query.tenantId || null;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant context is required. Super Admin must provide a tenantId." });
        }
        // Verify user exists in radcheck
        const userExist = await db
            .select({ id: radcheck.id })
            .from(radcheck)
            .where(and(eq(radcheck.username, username), eq(radcheck.tenantId, targetTenantId)))
            .limit(1);
        if (userExist.length === 0) {
            return reply.status(404).send({ error: "User not found" });
        }
        // Get profile
        const profileRes = await db
            .select()
            .from(radusergroup)
            .where(and(eq(radusergroup.username, username), eq(radusergroup.tenantId, targetTenantId)))
            .limit(1);
        const profileName = profileRes.length > 0 ? profileRes[0]?.groupname : "Default";
        // Get active session
        const activeSessionRes = await db
            .select()
            .from(radacct)
            .where(and(eq(radacct.username, username), eq(radacct.tenantId, targetTenantId), isNull(radacct.acctstoptime)))
            .limit(1);
        const activeSession = activeSessionRes[0] || null;
        // Get lifetime stats (Total data, total session time, last login)
        const statsQuery = await db.execute(sql `
      SELECT 
        SUM(COALESCE(acctinputoctets, 0) + COALESCE(acctoutputoctets, 0))::bigint as "totalBytes",
        SUM(COALESCE(acctsessiontime, 0))::bigint as "totalDuration",
        MAX(acctstarttime) as "lastLogin"
      FROM radacct
      WHERE username = ${username} AND tenant_id = ${targetTenantId}::uuid
    `);
        const stats = statsQuery[0] || { totalBytes: 0, totalDuration: 0, lastLogin: null };
        // Get unique MAC addresses
        const macsQuery = await db.execute(sql `
      SELECT DISTINCT callingstationid as "mac"
      FROM radacct
      WHERE username = ${username} AND tenant_id = ${targetTenantId}::uuid AND callingstationid IS NOT NULL AND callingstationid != ''
    `);
        const macs = macsQuery.map((r) => r.mac);
        // Get recent 5 sessions
        const recentSessions = await db
            .select({
            radacctid: radacct.radacctid,
            acctstarttime: radacct.acctstarttime,
            acctstoptime: radacct.acctstoptime,
            acctsessiontime: radacct.acctsessiontime,
            nasipaddress: radacct.nasipaddress,
            framedipaddress: radacct.framedipaddress,
            callingstationid: radacct.callingstationid,
            acctterminatecause: radacct.acctterminatecause,
        })
            .from(radacct)
            .where(and(eq(radacct.username, username), eq(radacct.tenantId, targetTenantId)))
            .orderBy(desc(radacct.acctstarttime))
            .limit(5);
        return reply.send({
            username,
            profileName,
            activeSession,
            stats: {
                totalBytes: String(stats.totalBytes || 0),
                totalDuration: Number(stats.totalDuration || 0),
                lastLogin: stats.lastLogin,
            },
            macs,
            recentSessions,
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
//# sourceMappingURL=users.controller.js.map