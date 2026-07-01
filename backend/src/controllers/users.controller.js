import { db } from "../db";
import { radcheck, radacct, radusergroup, radreply } from "../schema/freeradius";
import { eq, and, isNull, isNotNull, not, sql, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { organizations, userOrganizations } from "../schema/organizations";
import { nas } from "../schema/nas";
import { userinfo } from "../schema/userinfo";
const userSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(4),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    memberId: z.string().min(1),
    citizenId: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    expiration: z.string().optional(),
    profileName: z.string().min(1).optional(),
    groupId: z.string().uuid().optional(),
    tenantId: z.string().optional(),
});
const userUpdateSchema = z.object({
    password: z.string().min(4).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    memberId: z.string().min(1).optional(),
    citizenId: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    expiration: z.string().optional(),
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
        const showDeleted = request.query.showDeleted === 'true';
        const baseCondition = eq(radcheck.attribute, 'Cleartext-Password');
        const deleteCondition = showDeleted
            ? isNotNull(radcheck.deletedAt)
            : isNull(radcheck.deletedAt);
        const whereCondition = effectiveTenantId
            ? and(baseCondition, deleteCondition, eq(radcheck.tenantId, effectiveTenantId))
            : and(baseCondition, deleteCondition);
        const radcheckUsers = await db
            .select({
            id: radcheck.id,
            username: radcheck.username,
            tenantId: radcheck.tenantId,
        })
            .from(radcheck)
            .where(whereCondition)
            .limit(50);
        const usernames = radcheckUsers.map(u => u.username);
        let suspendedUsernames = new Set();
        if (usernames.length > 0) {
            const suspendedWhere = effectiveTenantId
                ? and(inArray(radcheck.username, usernames), eq(radcheck.tenantId, effectiveTenantId), eq(radcheck.attribute, "Auth-Type"), eq(radcheck.value, "Reject"))
                : and(inArray(radcheck.username, usernames), eq(radcheck.attribute, "Auth-Type"), eq(radcheck.value, "Reject"));
            const suspendedRes = await db.select({ username: radcheck.username, tenantId: radcheck.tenantId })
                .from(radcheck)
                .where(suspendedWhere);
            suspendedUsernames = new Set(suspendedRes.map(s => `${s.tenantId}:${s.username}`));
        }
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
                isSuspended: suspendedUsernames.has(`${u.tenantId}:${u.username}`),
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
        // Insert additional attributes into userinfo
        await db.insert(userinfo).values({
            tenantId: targetTenantId,
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            memberId: data.memberId,
            citizenId: data.citizenId || null,
            email: data.email || null,
            phone: data.phone || null,
        });
        // Insert Expiration if provided
        if (data.expiration) {
            await db.insert(radcheck).values({
                tenantId: targetTenantId,
                username: data.username,
                attribute: "Expiration",
                op: ":=",
                value: data.expiration
            });
        }
        // Resolve Profile from Group if provided
        let finalProfileName = data.profileName;
        let shouldSuspendNewUser = false;
        if (data.groupId) {
            const groupRes = await db.select().from(organizations).where(and(eq(organizations.id, data.groupId), eq(organizations.tenantId, targetTenantId))).limit(1);
            if (groupRes.length > 0 && groupRes[0].defaultProfile) {
                finalProfileName = groupRes[0].defaultProfile;
            }
            // Check if group is fully suspended
            const [activeCountRes] = await db.select({ count: sql `cast(count(${userOrganizations.id}) as int)` })
                .from(userOrganizations)
                .innerJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password'), isNull(radcheck.deletedAt)))
                .where(eq(userOrganizations.organizationId, data.groupId));
            const activeCount = activeCountRes?.count || 0;
            if (activeCount > 0) {
                const [suspendedCountRes] = await db.select({ count: sql `cast(count(${userOrganizations.id}) as int)` })
                    .from(userOrganizations)
                    .innerJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password'), isNull(radcheck.deletedAt)))
                    .where(and(eq(userOrganizations.organizationId, data.groupId), sql `EXISTS (
              SELECT 1 FROM radcheck rc2 
              WHERE rc2.username = ${userOrganizations.username} 
                AND rc2.tenant_id = ${userOrganizations.tenantId} 
                AND rc2.attribute = 'Auth-Type' 
                AND rc2.value = 'Reject'
            )`));
                const suspendedCount = suspendedCountRes?.count || 0;
                if (suspendedCount === activeCount) {
                    shouldSuspendNewUser = true;
                }
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
        // Apply group suspension inheritance
        if (shouldSuspendNewUser) {
            await db.insert(radcheck)
                .values({
                tenantId: targetTenantId,
                username: data.username,
                attribute: "Auth-Type",
                op: ":=",
                value: "Reject"
            })
                .onConflictDoUpdate({
                target: [radcheck.tenantId, radcheck.username, radcheck.attribute],
                set: { value: "Reject", op: ":=", deletedAt: null }
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
        // Update personal information in userinfo
        const userInfoUpdate = {};
        if (data.firstName !== undefined)
            userInfoUpdate.firstName = data.firstName;
        if (data.lastName !== undefined)
            userInfoUpdate.lastName = data.lastName;
        if (data.memberId !== undefined)
            userInfoUpdate.memberId = data.memberId;
        if (data.citizenId !== undefined)
            userInfoUpdate.citizenId = data.citizenId || null;
        if (data.email !== undefined)
            userInfoUpdate.email = data.email || null;
        if (data.phone !== undefined)
            userInfoUpdate.phone = data.phone || null;
        if (Object.keys(userInfoUpdate).length > 0) {
            const existingInfo = await db.select().from(userinfo).where(and(eq(userinfo.tenantId, targetTenantId), eq(userinfo.username, username))).limit(1);
            if (existingInfo.length > 0) {
                userInfoUpdate.updatedAt = new Date();
                await db.update(userinfo).set(userInfoUpdate).where(and(eq(userinfo.tenantId, targetTenantId), eq(userinfo.username, username)));
            }
            else {
                await db.insert(userinfo).values({
                    tenantId: targetTenantId,
                    username: username,
                    ...userInfoUpdate
                });
            }
        }
        if (data.expiration !== undefined) {
            if (data.expiration === "") {
                await db.delete(radcheck).where(and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, username), eq(radcheck.attribute, "Expiration")));
            }
            else {
                const existingExp = await db.select().from(radcheck).where(and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, username), eq(radcheck.attribute, "Expiration"))).limit(1);
                if (existingExp.length > 0) {
                    await db.update(radcheck).set({ value: data.expiration }).where(and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, username), eq(radcheck.attribute, "Expiration")));
                }
                else {
                    await db.insert(radcheck).values({
                        tenantId: targetTenantId,
                        username: username,
                        attribute: "Expiration",
                        op: ":=",
                        value: data.expiration
                    });
                }
            }
        }
        if (data.profileName) {
            await db.update(radusergroup).set({ groupname: data.profileName }).where(and(eq(radusergroup.tenantId, targetTenantId), eq(radusergroup.username, username)));
        }
        if (data.groupId !== undefined) {
            let shouldSuspendNewUser = false;
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
                // Check if group is fully suspended
                const [activeCountRes] = await db.select({ count: sql `cast(count(${userOrganizations.id}) as int)` })
                    .from(userOrganizations)
                    .innerJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password'), isNull(radcheck.deletedAt)))
                    .where(eq(userOrganizations.organizationId, data.groupId));
                const activeCount = activeCountRes?.count || 0;
                if (activeCount > 0) {
                    const [suspendedCountRes] = await db.select({ count: sql `cast(count(${userOrganizations.id}) as int)` })
                        .from(userOrganizations)
                        .innerJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password'), isNull(radcheck.deletedAt)))
                        .where(and(eq(userOrganizations.organizationId, data.groupId), sql `EXISTS (
                SELECT 1 FROM radcheck rc2 
                WHERE rc2.username = ${userOrganizations.username} 
                  AND rc2.tenant_id = ${userOrganizations.tenantId} 
                  AND rc2.attribute = 'Auth-Type' 
                  AND rc2.value = 'Reject'
              )`));
                    const suspendedCount = suspendedCountRes?.count || 0;
                    if (suspendedCount === activeCount) {
                        shouldSuspendNewUser = true;
                    }
                }
                if (shouldSuspendNewUser) {
                    await db.insert(radcheck)
                        .values({
                        tenantId: targetTenantId,
                        username: username,
                        attribute: "Auth-Type",
                        op: ":=",
                        value: "Reject"
                    })
                        .onConflictDoUpdate({
                        target: [radcheck.tenantId, radcheck.username, radcheck.attribute],
                        set: { value: "Reject", op: ":=", deletedAt: null }
                    });
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
        // Soft Delete
        await db.update(radcheck).set({ deletedAt: new Date() }).where(and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, username)));
        // Disconnect user session if active
        const activeSession = await db.select().from(radacct).where(and(eq(radacct.tenantId, targetTenantId), eq(radacct.username, username), isNull(radacct.acctstoptime))).limit(1);
        if (activeSession.length > 0 && activeSession[0].nasipaddress) {
            const nasRecords = await db.select().from(nas).where(eq(nas.tenantId, targetTenantId));
            const nasMap = new Map(nasRecords.map(n => [n.nasname, n.secret]));
            const secret = nasMap.get(activeSession[0].nasipaddress);
            if (secret) {
                try {
                    const { RadiusCoAService } = await import("../services/radius-coa.service");
                    RadiusCoAService.disconnectUser({ ip: activeSession[0].nasipaddress, secret }, username).catch(() => { });
                }
                catch (e) { }
            }
        }
        reply.send({ message: "User moved to trash successfully" });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
export const restoreUser = async (request, reply) => {
    try {
        const user = request.user;
        const { username } = request.params;
        const targetTenantId = user.tenantId || request.query.tenantId || null;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant context is required." });
        }
        await db.update(radcheck).set({ deletedAt: null }).where(and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, username)));
        reply.send({ message: "User restored successfully" });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};
export const permanentDeleteUser = async (request, reply) => {
    try {
        const user = request.user;
        const { username } = request.params;
        const targetTenantId = user.tenantId || request.query.tenantId || null;
        if (!targetTenantId) {
            return reply.status(400).send({ error: "Tenant context is required." });
        }
        // Hard delete
        await db.delete(radcheck).where(and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, username)));
        await db.delete(radusergroup).where(and(eq(radusergroup.tenantId, targetTenantId), eq(radusergroup.username, username)));
        await db.delete(userOrganizations).where(and(eq(userOrganizations.tenantId, targetTenantId), eq(userOrganizations.username, username)));
        reply.send({ message: "User deleted permanently" });
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
        // Get extra user details from userinfo and radcheck
        const userInfoRes = await db
            .select()
            .from(userinfo)
            .where(and(eq(userinfo.username, username), eq(userinfo.tenantId, targetTenantId)))
            .limit(1);
        const uInfo = userInfoRes[0] || {};
        const checkAttrs = await db
            .select({ attribute: radcheck.attribute, value: radcheck.value })
            .from(radcheck)
            .where(and(eq(radcheck.username, username), eq(radcheck.tenantId, targetTenantId)));
        const personalInfo = {
            firstName: uInfo.firstName || "",
            lastName: uInfo.lastName || "",
            memberId: uInfo.memberId || "",
            citizenId: uInfo.citizenId || "",
            email: uInfo.email || "",
            phone: uInfo.phone || ""
        };
        checkAttrs.forEach(attr => {
            if (attr.attribute === "Expiration")
                personalInfo.expiration = attr.value;
        });
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
            personalInfo,
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