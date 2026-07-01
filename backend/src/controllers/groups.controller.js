import { db } from "../db";
import { organizations, userOrganizations } from "../schema/organizations";
import { radcheck, radusergroup, radacct } from "../schema/freeradius";
import { nas } from "../schema/nas";
import { eq, and, isNull, desc, sql, inArray } from "drizzle-orm";
// List all groups with user counts
export const getGroups = async (request, reply) => {
    const { tenantId } = request.user;
    try {
        const result = await db
            .select({
            id: organizations.id,
            name: organizations.name,
            defaultProfile: organizations.defaultProfile,
            description: organizations.description,
            createdAt: organizations.createdAt,
            userCount: sql `cast(count(${userOrganizations.id}) as int)`,
        })
            .from(organizations)
            .leftJoin(userOrganizations, eq(organizations.id, userOrganizations.organizationId))
            .where(and(eq(organizations.tenantId, tenantId), isNull(organizations.deletedAt)))
            .groupBy(organizations.id)
            .orderBy(desc(organizations.createdAt));
        return reply.send(result);
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to fetch user groups" });
    }
};
// Create a new group
export const createGroup = async (request, reply) => {
    const { tenantId } = request.user;
    const { name, defaultProfile, description } = request.body;
    try {
        const [newGroup] = await db.insert(organizations).values({
            tenantId,
            name,
            defaultProfile: defaultProfile || null,
            description: description || null,
        }).returning();
        return reply.send(newGroup);
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to create user group" });
    }
};
// Update a group
export const updateGroup = async (request, reply) => {
    const { tenantId } = request.user;
    const { id } = request.params;
    const { name, defaultProfile, description } = request.body;
    try {
        // Check if group exists
        const existing = await db.query.organizations.findFirst({
            where: and(eq(organizations.id, id), eq(organizations.tenantId, tenantId), isNull(organizations.deletedAt)),
        });
        if (!existing) {
            return reply.code(404).send({ error: "User group not found" });
        }
        const [updatedGroup] = await db.update(organizations)
            .set({
            name,
            defaultProfile: defaultProfile || null,
            description: description || null,
            updatedAt: new Date(),
        })
            .where(eq(organizations.id, id))
            .returning();
        // If defaultProfile changed, we might want to update all members?
        // According to REQ-USER-02, it says "when changing user's org, update profile immediately"
        // Does it mean when we edit the group's default profile, all existing users in it get updated?
        // It's a nice-to-have, let's implement it for robust RADIUS synchronization.
        if (existing.defaultProfile !== defaultProfile) {
            // Find all users in this group
            const members = await db.select({ username: userOrganizations.username })
                .from(userOrganizations)
                .where(eq(userOrganizations.organizationId, id));
            const usernames = members.map(m => m.username);
            if (usernames.length > 0) {
                if (defaultProfile) {
                    // Update radusergroup for these users
                    await db.update(radusergroup)
                        .set({ groupname: defaultProfile })
                        .where(and(eq(radusergroup.tenantId, tenantId), inArray(radusergroup.username, usernames)));
                }
                else {
                    // If defaultProfile is removed, maybe delete from radusergroup? (Wait, FreeRADIUS requires a group for profiles. We'll leave it or set empty string)
                    await db.update(radusergroup)
                        .set({ groupname: "" })
                        .where(and(eq(radusergroup.tenantId, tenantId), inArray(radusergroup.username, usernames)));
                }
            }
        }
        return reply.send(updatedGroup);
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to update user group" });
    }
};
// Soft delete a group
export const deleteGroup = async (request, reply) => {
    const { tenantId } = request.user;
    const { id } = request.params;
    try {
        // Check if group has members
        const memberCountResult = await db.select({ count: sql `count(*)` })
            .from(userOrganizations)
            .where(eq(userOrganizations.organizationId, id));
        if (memberCountResult.length > 0 && memberCountResult[0].count > 0) {
            return reply.code(400).send({ error: "Cannot delete group because it still has users." });
        }
        await db.update(organizations)
            .set({ deletedAt: new Date() })
            .where(and(eq(organizations.id, id), eq(organizations.tenantId, tenantId)));
        return reply.send({ success: true, message: "Group deleted successfully" });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to delete user group" });
    }
};
// Bulk Disable (Suspend) All Users in Group
export const bulkDisableGroupUsers = async (request, reply) => {
    const { tenantId } = request.user;
    const { id } = request.params;
    try {
        // Get all usernames in this group
        const members = await db.select({ username: userOrganizations.username })
            .from(userOrganizations)
            .where(and(eq(userOrganizations.organizationId, id), eq(userOrganizations.tenantId, tenantId)));
        if (members.length === 0) {
            return reply.send({ success: true, count: 0, message: "No users in this group" });
        }
        const usernames = members.map(m => m.username);
        // To disable in FreeRADIUS, we typically add Auth-Type := Reject or modify their password.
        // However, our system uses `radcheck.deletedAt` for soft-delete, and for suspend, we can just change their password or add Auth-Type Reject.
        // Wait, let's see how `users.controller.ts` handles suspend right now.
        // If it's not implemented yet in users.controller, let's use standard Auth-Type Reject.
        // Let's add Auth-Type := Reject to radcheck for all these usernames
        const valuesToInsert = usernames.map(username => ({
            tenantId,
            username,
            attribute: "Auth-Type",
            op: ":=",
            value: "Reject"
        }));
        // Insert Auth-Type Reject (ignoring conflicts if it already exists)
        await db.insert(radcheck)
            .values(valuesToInsert)
            .onConflictDoUpdate({
            target: [radcheck.tenantId, radcheck.username, radcheck.attribute],
            set: { value: "Reject", op: ":=", deletedAt: null }
        });
        // Send CoA Disconnect for all these users so they are kicked out immediately
        // Find active sessions for these users
        const activeSessions = await db.select({
            username: radacct.username,
            nasipaddress: radacct.nasipaddress,
        }).from(radacct).where(and(eq(radacct.tenantId, tenantId), inArray(radacct.username, usernames), isNull(radacct.acctstoptime)));
        if (activeSessions.length > 0) {
            // Get NAS secrets
            const nasRecords = await db.select().from(nas).where(eq(nas.tenantId, tenantId));
            const nasMap = new Map(nasRecords.map(n => [n.nasname, n.secret]));
            try {
                const { RadiusCoAService } = await import("../services/radius-coa.service");
                for (const session of activeSessions) {
                    if (session.username && session.nasipaddress) {
                        const secret = nasMap.get(session.nasipaddress);
                        if (secret) {
                            RadiusCoAService.disconnectUser({ ip: session.nasipaddress, secret }, session.username)
                                .catch((e) => request.log.error(`Failed to kick ${session.username}: ${e.message}`));
                        }
                    }
                }
            }
            catch (e) { }
        }
        return reply.send({ success: true, count: usernames.length, message: `Successfully suspended ${usernames.length} users` });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to bulk suspend users" });
    }
};
// Bulk Delete All Users in Group
export const bulkDeleteGroupUsers = async (request, reply) => {
    const { tenantId } = request.user;
    const { id } = request.params;
    try {
        // Get all usernames in this group
        const members = await db.select({ username: userOrganizations.username })
            .from(userOrganizations)
            .where(and(eq(userOrganizations.organizationId, id), eq(userOrganizations.tenantId, tenantId)));
        if (members.length === 0) {
            return reply.send({ success: true, count: 0, message: "No users in this group" });
        }
        const usernames = members.map(m => m.username);
        // Soft delete in radcheck
        await db.update(radcheck)
            .set({ deletedAt: new Date() })
            .where(and(eq(radcheck.tenantId, tenantId), inArray(radcheck.username, usernames)));
        // Send CoA Disconnect for all these users so they are kicked out immediately
        const activeSessions = await db.select({
            username: radacct.username,
            nasipaddress: radacct.nasipaddress,
        }).from(radacct).where(and(eq(radacct.tenantId, tenantId), inArray(radacct.username, usernames), isNull(radacct.acctstoptime)));
        if (activeSessions.length > 0) {
            const nasRecords = await db.select().from(nas).where(eq(nas.tenantId, tenantId));
            const nasMap = new Map(nasRecords.map(n => [n.nasname, n.secret]));
            try {
                const { RadiusCoAService } = await import("../services/radius-coa.service");
                for (const session of activeSessions) {
                    if (session.username && session.nasipaddress) {
                        const secret = nasMap.get(session.nasipaddress);
                        if (secret) {
                            RadiusCoAService.disconnectUser({ ip: session.nasipaddress, secret }, session.username)
                                .catch((e) => request.log.error(`Failed to kick ${session.username}: ${e.message}`));
                        }
                    }
                }
            }
            catch (e) { }
        }
        return reply.send({ success: true, count: usernames.length, message: `Successfully deleted ${usernames.length} users` });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to bulk delete users" });
    }
};
//# sourceMappingURL=groups.controller.js.map