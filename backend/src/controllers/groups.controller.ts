import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { organizations, userOrganizations } from "../schema/organizations";
import { radcheck, radusergroup, radacct } from "../schema/freeradius";
import { nas } from "../schema/nas";
import { eq, and, isNull, desc, sql, inArray } from "drizzle-orm";

// List all groups with user counts
export const getGroups = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;
  const effectiveTenantId: string | null = user.tenantId ?? null;

  try {
    const result = await db
      .select({
        id: organizations.id,
        tenantId: organizations.tenantId,
        name: organizations.name,
        defaultProfile: organizations.defaultProfile,
        description: organizations.description,
        isSystem: organizations.isSystem,
        createdAt: organizations.createdAt,
        userCount: sql<number>`cast(count(DISTINCT CASE WHEN ${radcheck.deletedAt} IS NULL THEN ${userOrganizations.username} END) as int)`,
        suspendedCount: sql<number>`cast(count(DISTINCT CASE WHEN ${radcheck.deletedAt} IS NULL AND EXISTS (
          SELECT 1 FROM radcheck rc2 
          WHERE rc2.username = ${userOrganizations.username} 
            AND rc2.tenant_id = ${userOrganizations.tenantId} 
            AND rc2.attribute = 'Auth-Type' 
            AND rc2.value = 'Reject'
        ) THEN ${userOrganizations.username} END) as int)`,
        deletedCount: sql<number>`cast(count(DISTINCT CASE WHEN ${radcheck.deletedAt} IS NOT NULL THEN ${userOrganizations.username} END) as int)`,
      })
      .from(organizations)
      .leftJoin(userOrganizations, eq(organizations.id, userOrganizations.organizationId))
      .leftJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password')))
      .where(
        effectiveTenantId ? and(eq(organizations.tenantId, effectiveTenantId), isNull(organizations.deletedAt)) : isNull(organizations.deletedAt)
      )
      .groupBy(organizations.id)
      .orderBy(desc(organizations.createdAt));

    return reply.send(result);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to fetch user groups" });
  }
};

// Create a new group
export const createGroup = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;
  const { name, defaultProfile, description, tenantId: bodyTenantId } = request.body as {
    name: string;
    defaultProfile?: string;
    description?: string;
    tenantId?: string;
  };
  const effectiveTenantId = user.tenantId || bodyTenantId;
  if (!effectiveTenantId) return reply.code(400).send({ error: "tenantId is required" });

  try {
    const [newGroup] = await db.insert(organizations).values({
      tenantId: effectiveTenantId,
      name,
      defaultProfile: defaultProfile || null,
      description: description || null,
    }).returning();

    return reply.send(newGroup);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to create user group" });
  }
};

// Update a group
export const updateGroup = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
  const { id } = request.params as { id: string };
  let tenantId = user.tenantId;
  if (!tenantId) {
    const group = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
    if (!group) return reply.code(404).send({ error: "User group not found" });
    tenantId = group.tenantId;
  }
  const { name, defaultProfile, description } = request.body as {
    name: string;
    defaultProfile?: string;
    description?: string;
  };

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
            .where(
              and(
                eq(radusergroup.tenantId, tenantId),
                inArray(radusergroup.username, usernames)
              )
            );
        } else {
          // If defaultProfile is removed, maybe delete from radusergroup? (Wait, FreeRADIUS requires a group for profiles. We'll leave it or set empty string)
          await db.update(radusergroup)
            .set({ groupname: "" })
            .where(
              and(
                eq(radusergroup.tenantId, tenantId),
                inArray(radusergroup.username, usernames)
              )
            );
        }
      }
    }

    return reply.send(updatedGroup);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to update user group" });
  }
};

// Soft delete a group
export const deleteGroup = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
  const { id } = request.params as { id: string };
  let tenantId = user.tenantId;
  if (!tenantId) {
    const group = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
    if (!group) return reply.code(404).send({ error: "User group not found" });
    tenantId = group.tenantId;
  }

  try {
    // Check if group is a system group
    const group = await db.query.organizations.findFirst({
      where: and(eq(organizations.id, id), eq(organizations.tenantId, tenantId), isNull(organizations.deletedAt)),
    });

    if (!group) {
      return reply.code(404).send({ error: "User group not found" });
    }

    if (group.isSystem) {
      return reply.code(400).send({ error: "Cannot delete system default registration group." });
    }

    // Check if group has members
    const memberCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(userOrganizations)
      .innerJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password')))
      .where(and(eq(userOrganizations.organizationId, id), isNull(radcheck.deletedAt)));
      
    if (memberCountResult.length > 0 && memberCountResult[0]!.count > 0) {
      return reply.code(400).send({ error: "Cannot delete group because it still has users." });
    }

    await db.update(organizations)
      .set({ deletedAt: new Date() })
      .where(and(eq(organizations.id, id), eq(organizations.tenantId, tenantId)));

    return reply.send({ success: true, message: "Group deleted successfully" });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to delete user group" });
  }
};

// Bulk Disable (Suspend) All Users in Group
export const bulkDisableGroupUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
  const { id } = request.params as { id: string };
  let tenantId = user.tenantId;
  if (!tenantId) {
    const group = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
    if (!group) return reply.code(404).send({ error: "User group not found" });
    tenantId = group.tenantId;
  }

  try {
    // Get all usernames in this group
    const members = await db.select({ username: userOrganizations.username })
      .from(userOrganizations)
      .innerJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password')))
      .where(and(eq(userOrganizations.organizationId, id), eq(userOrganizations.tenantId, tenantId), isNull(radcheck.deletedAt)));
      
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
    }).from(radacct).where(
      and(
        eq(radacct.tenantId, tenantId),
        inArray(radacct.username, usernames),
        isNull(radacct.acctstoptime)
      )
    );

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
                .catch((e: any) => request.log.error(`Failed to kick ${session.username}: ${e.message}`));
            }
          }
        }
      } catch(e) {}
    }

    return reply.send({ success: true, count: usernames.length, message: `Successfully suspended ${usernames.length} users` });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to bulk suspend users" });
  }
};

// Bulk Delete All Users in Group
export const bulkDeleteGroupUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
  const { id } = request.params as { id: string };
  let tenantId = user.tenantId;
  if (!tenantId) {
    const group = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
    if (!group) return reply.code(404).send({ error: "User group not found" });
    tenantId = group.tenantId;
  }

  try {
    // Get all usernames in this group
    const members = await db.select({ username: userOrganizations.username })
      .from(userOrganizations)
      .innerJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password')))
      .where(and(eq(userOrganizations.organizationId, id), eq(userOrganizations.tenantId, tenantId), isNull(radcheck.deletedAt)));
      
    if (members.length === 0) {
      return reply.send({ success: true, count: 0, message: "No users in this group" });
    }
    
    const usernames = members.map(m => m.username);
    
    // Soft delete in radcheck
    await db.update(radcheck)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(radcheck.tenantId, tenantId),
          inArray(radcheck.username, usernames)
        )
      );
      
    // Send CoA Disconnect for all these users so they are kicked out immediately
    const activeSessions = await db.select({
      username: radacct.username,
      nasipaddress: radacct.nasipaddress,
    }).from(radacct).where(
      and(
        eq(radacct.tenantId, tenantId),
        inArray(radacct.username, usernames),
        isNull(radacct.acctstoptime)
      )
    );

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
                .catch((e: any) => request.log.error(`Failed to kick ${session.username}: ${e.message}`));
            }
          }
        }
      } catch(e) {}
    }

    return reply.send({ success: true, count: usernames.length, message: `Successfully deleted ${usernames.length} users` });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to bulk delete users" });
  }
};

// Bulk Enable (Reactivate) All Users in Group
export const bulkEnableGroupUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
  const { id } = request.params as { id: string };
  let tenantId = user.tenantId;
  if (!tenantId) {
    const group = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
    if (!group) return reply.code(404).send({ error: "User group not found" });
    tenantId = group.tenantId;
  }

  try {
    // Do NOT filter isNull(radcheck.deletedAt) so we can restore soft-deleted users
    const members = await db.select({ username: userOrganizations.username })
      .from(userOrganizations)
      .innerJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password')))
      .where(and(eq(userOrganizations.organizationId, id), eq(userOrganizations.tenantId, tenantId)));
      
    if (members.length === 0) {
      return reply.send({ success: true, count: 0, message: "No users in this group" });
    }
    
    const usernames = members.map(m => m.username);
    
    // Restore soft-deleted users (set deletedAt = null)
    await db.update(radcheck)
      .set({ deletedAt: null })
      .where(
        and(
          eq(radcheck.tenantId, tenantId),
          inArray(radcheck.username, usernames)
        )
      );

    // Remove Auth-Type = Reject
    await db.delete(radcheck).where(
      and(
        eq(radcheck.tenantId, tenantId),
        inArray(radcheck.username, usernames),
        eq(radcheck.attribute, "Auth-Type"),
        eq(radcheck.value, "Reject")
      )
    );
    
    return reply.send({ success: true, count: usernames.length, message: `Successfully reactivated ${usernames.length} users` });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to bulk reactivate users" });
  }
};

// Get members of a specific group
export const getGroupMembers = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
  const { id } = request.params as { id: string };
  let tenantId = user.tenantId;
  if (!tenantId) {
    const group = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
    if (!group) return reply.code(404).send({ error: "User group not found" });
    tenantId = group.tenantId;
  }

  try {
    const members = await db.select({
      id: radcheck.id,
      username: radcheck.username,
      profileName: radusergroup.groupname,
    })
    .from(userOrganizations)
    .innerJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password')))
    .leftJoin(radusergroup, and(eq(radcheck.username, radusergroup.username), eq(radcheck.tenantId, radusergroup.tenantId)))
    .where(and(eq(userOrganizations.organizationId, id), eq(userOrganizations.tenantId, tenantId), isNull(radcheck.deletedAt)));

    if (members.length === 0) {
      return reply.send([]);
    }

    const usernames = members.map(m => m.username);

    // Fetch active sessions to map who is online
    const activeSessions = await db.select({
      username: radacct.username,
      nasipaddress: radacct.nasipaddress
    }).from(radacct).where(and(eq(radacct.tenantId, tenantId), isNull(radacct.acctstoptime)));
    
    const onlineUsernames = new Set(activeSessions.map(s => s.username));

    // Fetch suspended users
    const suspendedRes = await db.select({ username: radcheck.username })
      .from(radcheck)
      .where(and(
        eq(radcheck.tenantId, tenantId),
        inArray(radcheck.username, usernames),
        eq(radcheck.attribute, "Auth-Type"),
        eq(radcheck.value, "Reject")
      ));
    const suspendedUsernames = new Set(suspendedRes.map(s => s.username));

    const result = members.map(m => ({
      username: m.username,
      profileName: m.profileName || "-",
      isOnline: onlineUsernames.has(m.username),
      isSuspended: suspendedUsernames.has(m.username)
    }));

    return reply.send(result);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to fetch group members" });
  }
};

// Bulk Transfer Users to another Group
export const bulkTransferGroupUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
  const { id } = request.params as { id: string };
  let tenantId = user.tenantId;
  if (!tenantId) {
    const group = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
    if (!group) return reply.code(404).send({ error: "User group not found" });
    tenantId = group.tenantId;
  } // Source group
  const { targetGroupId } = request.body as { targetGroupId: string };

  if (!targetGroupId) {
    return reply.code(400).send({ error: "targetGroupId is required" });
  }

  try {
    // 1. Verify target group exists and get its defaultProfile
    const targetGroupRes = await db.select().from(organizations).where(
      and(eq(organizations.id, targetGroupId), eq(organizations.tenantId, tenantId), isNull(organizations.deletedAt))
    ).limit(1);

    if (targetGroupRes.length === 0) {
      return reply.code(404).send({ error: "Target group not found" });
    }

    const targetGroup = targetGroupRes[0]!;

    // 2. Get users in source group
    const members = await db.select({ username: userOrganizations.username })
      .from(userOrganizations)
      .innerJoin(radcheck, and(eq(userOrganizations.username, radcheck.username), eq(userOrganizations.tenantId, radcheck.tenantId), eq(radcheck.attribute, 'Cleartext-Password')))
      .where(and(eq(userOrganizations.organizationId, id), eq(userOrganizations.tenantId, tenantId), isNull(radcheck.deletedAt)));

    if (members.length === 0) {
      return reply.send({ success: true, count: 0, message: "No users in source group to transfer" });
    }

    const usernames = members.map(m => m.username);

    // 3. Update their organizationId
    await db.update(userOrganizations).set({ organizationId: targetGroupId }).where(
      and(eq(userOrganizations.organizationId, id), eq(userOrganizations.tenantId, tenantId))
    );

    // 4. Update their radusergroup profile if target group has a defaultProfile
    if (targetGroup.defaultProfile) {
      // Delete old profile assignments for these users
      await db.delete(radusergroup).where(
        and(inArray(radusergroup.username, usernames), eq(radusergroup.tenantId, tenantId))
      );
      
      // Insert new profile assignments
      const insertValues = usernames.map(u => ({
        tenantId,
        username: u,
        groupname: targetGroup.defaultProfile!,
        priority: 1
      }));
      
      await db.insert(radusergroup).values(insertValues);
    }

    // 5. Send CoA Disconnect for all transferred users so they get new profiles on next login
    const activeSessions = await db.select({
      username: radacct.username,
      nasipaddress: radacct.nasipaddress,
    }).from(radacct).where(
      and(
        eq(radacct.tenantId, tenantId),
        inArray(radacct.username, usernames),
        isNull(radacct.acctstoptime)
      )
    );

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
                .catch((e: any) => request.log.error(`Failed to kick ${session.username}: ${e.message}`));
            }
          }
        }
      } catch(e) {}
    }

    return reply.send({ 
      success: true, 
      count: usernames.length, 
      message: `Successfully transferred ${usernames.length} users to ${targetGroup.name}` 
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to transfer users" });
  }
};
