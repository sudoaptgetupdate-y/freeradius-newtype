import { db } from "../db";
import { radcheck, radacct, radreply, radusergroup } from "../schema/freeradius";
import { userOrganizations, organizations } from "../schema/organizations";
import { nas } from "../schema/nas";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { userinfo } from "../schema/userinfo";
import { RadiusCoAService } from "../services/radius-coa.service";
// Helper to disconnect users
async function disconnectActiveUsers(tenantId, usernames, request) {
    try {
        const activeSessions = await db.select().from(radacct).where(and(eq(radacct.tenantId, tenantId), inArray(radacct.username, usernames), isNull(radacct.acctstoptime)));
        if (activeSessions.length > 0) {
            const nasRecords = await db.select().from(nas).where(eq(nas.tenantId, tenantId));
            const nasMap = new Map(nasRecords.map(n => [n.nasname, n.secret]));
            for (const session of activeSessions) {
                if (session.nasipaddress) {
                    const secret = nasMap.get(session.nasipaddress);
                    if (secret) {
                        try {
                            await RadiusCoAService.disconnectUser({ ip: session.nasipaddress, secret }, session.username);
                        }
                        catch (e) {
                            request.log.warn(`Failed to disconnect ${session.username} on ${session.nasipaddress}`);
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        request.log.error(error);
    }
}
export const bulkDisableUsers = async (request, reply) => {
    const { tenantId } = request.user;
    const { usernames } = request.body;
    if (!usernames || usernames.length === 0) {
        return reply.status(400).send({ error: "No users provided" });
    }
    try {
        // 1. Check existing Reject records
        const existingRejects = await db.select({ username: radcheck.username })
            .from(radcheck)
            .where(and(eq(radcheck.tenantId, tenantId), inArray(radcheck.username, usernames), eq(radcheck.attribute, "Auth-Type"), eq(radcheck.value, "Reject")));
        const existingRejectUsers = new Set(existingRejects.map(r => r.username));
        // 2. Filter users that don't have Reject yet
        const usersToSuspend = usernames.filter(u => !existingRejectUsers.has(u));
        if (usersToSuspend.length > 0) {
            // 3. Insert Auth-Type = Reject
            await db.insert(radcheck).values(usersToSuspend.map(username => ({
                username,
                attribute: "Auth-Type",
                op: ":=",
                value: "Reject",
                tenantId
            })));
        }
        // 4. Disconnect active sessions
        await disconnectActiveUsers(tenantId, usernames, request);
        return reply.send({ success: true, count: usernames.length, message: `Successfully suspended ${usernames.length} users` });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to bulk suspend users" });
    }
};
export const bulkEnableUsers = async (request, reply) => {
    const { tenantId } = request.user;
    const { usernames } = request.body;
    if (!usernames || usernames.length === 0) {
        return reply.status(400).send({ error: "No users provided" });
    }
    try {
        await db.delete(radcheck).where(and(eq(radcheck.tenantId, tenantId), inArray(radcheck.username, usernames), eq(radcheck.attribute, "Auth-Type"), eq(radcheck.value, "Reject")));
        return reply.send({ success: true, count: usernames.length, message: `Successfully reactivated ${usernames.length} users` });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to bulk reactivate users" });
    }
};
export const bulkDeleteUsers = async (request, reply) => {
    const { tenantId } = request.user;
    const { usernames } = request.body;
    if (!usernames || usernames.length === 0) {
        return reply.status(400).send({ error: "No users provided" });
    }
    try {
        // Soft delete in radcheck
        await db.update(radcheck)
            .set({ deletedAt: new Date() })
            .where(and(eq(radcheck.tenantId, tenantId), inArray(radcheck.username, usernames)));
        // Disconnect active sessions
        await disconnectActiveUsers(tenantId, usernames, request);
        return reply.send({ success: true, count: usernames.length, message: `Successfully deleted ${usernames.length} users` });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to bulk delete users" });
    }
};
export const bulkTransferUsers = async (request, reply) => {
    const { tenantId } = request.user;
    const { usernames, targetGroupId } = request.body;
    if (!usernames || usernames.length === 0) {
        return reply.status(400).send({ error: "No users provided" });
    }
    try {
        // Verify group exists
        const group = await db.select().from(organizations)
            .where(and(eq(organizations.id, targetGroupId), eq(organizations.tenantId, tenantId)))
            .limit(1);
        if (group.length === 0) {
            return reply.code(404).send({ error: "Target group not found" });
        }
        // Update organizations
        await db.delete(userOrganizations).where(and(eq(userOrganizations.tenantId, tenantId), inArray(userOrganizations.username, usernames)));
        await db.insert(userOrganizations).values(usernames.map(username => ({
            tenantId,
            username,
            organizationId: targetGroupId
        })));
        return reply.send({ success: true, count: usernames.length, message: `Successfully transferred ${usernames.length} users` });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to bulk transfer users" });
    }
};
export const bulkImportUsers = async (request, reply) => {
    const { tenantId } = request.user;
    const { users } = request.body;
    if (!users || users.length === 0) {
        return reply.status(400).send({ error: "No users provided" });
    }
    try {
        // Collect usernames to check for duplicates
        const usernames = users.map(u => u.username);
        // Chunk array helper
        const chunkArray = (arr, size) => arr.length > 0 ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)] : [];
        // Check existing
        let existingUsernames = [];
        for (const chunk of chunkArray(usernames, 500)) {
            const existing = await db.select({ username: radcheck.username })
                .from(radcheck)
                .where(and(eq(radcheck.tenantId, tenantId), inArray(radcheck.username, chunk)));
            existingUsernames.push(...existing.map(e => e.username));
        }
        if (existingUsernames.length > 0) {
            // Remove duplicates from the array
            const uniqueExisting = Array.from(new Set(existingUsernames)).slice(0, 5).join(", ");
            const moreMsg = existingUsernames.length > 5 ? ` and ${existingUsernames.length - 5} more` : '';
            return reply.status(409).send({ error: `The following usernames already exist: ${uniqueExisting}${moreMsg}` });
        }
        const radcheckInserts = [];
        const userInfoInserts = [];
        const userOrgInserts = [];
        const radusergroupInserts = [];
        // Pre-fetch all groups in this tenant for validating and mapping default profiles
        const groups = await db.select().from(organizations).where(eq(organizations.tenantId, tenantId));
        const groupMap = new Map(groups.map(g => [g.id, g]));
        for (const u of users) {
            // 1. Password
            radcheckInserts.push({
                tenantId,
                username: u.username,
                attribute: "Cleartext-Password",
                op: ":=",
                value: u.password
            });
            // 2. Expiration
            if (u.expiration) {
                radcheckInserts.push({
                    tenantId,
                    username: u.username,
                    attribute: "Expiration",
                    op: ":=",
                    value: u.expiration
                });
            }
            // 3. Personal Info (userinfo)
            userInfoInserts.push({
                tenantId,
                username: u.username,
                firstName: u.firstName || null,
                lastName: u.lastName || null,
                memberId: u.memberId || null,
                citizenId: u.citizenId || null,
                email: u.email || null,
                phone: u.phone || null
            });
            // 4. Group & Profile
            let finalProfileName = "Default";
            if (u.groupId) {
                const group = groupMap.get(u.groupId);
                if (group) {
                    userOrgInserts.push({
                        tenantId,
                        username: u.username,
                        organizationId: u.groupId
                    });
                    if (group.defaultProfile) {
                        finalProfileName = group.defaultProfile;
                    }
                }
            }
            radusergroupInserts.push({
                tenantId,
                username: u.username,
                groupname: finalProfileName,
                priority: 1
            });
        }
        if (radcheckInserts.length > 0) {
            for (const chunk of chunkArray(radcheckInserts, 500))
                await db.insert(radcheck).values(chunk);
        }
        if (userInfoInserts.length > 0) {
            for (const chunk of chunkArray(userInfoInserts, 500))
                await db.insert(userinfo).values(chunk);
        }
        if (userOrgInserts.length > 0) {
            for (const chunk of chunkArray(userOrgInserts, 500))
                await db.insert(userOrganizations).values(chunk);
        }
        if (radusergroupInserts.length > 0) {
            for (const chunk of chunkArray(radusergroupInserts, 500))
                await db.insert(radusergroup).values(chunk);
        }
        return reply.send({ success: true, count: users.length, message: `Successfully imported ${users.length} users` });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to bulk import users" });
    }
};
//# sourceMappingURL=users.bulk.controller.js.map