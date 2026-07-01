import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { radcheck, radacct } from "../schema/freeradius";
import { userOrganizations, organizations } from "../schema/organizations";
import { nas } from "../schema/nas";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { RadiusCoAService } from "../services/radius-coa.service";

// Helper to disconnect users
async function disconnectActiveUsers(tenantId: string, usernames: string[], request: FastifyRequest) {
  try {
    const activeSessions = await db.select().from(radacct).where(
      and(
        eq(radacct.tenantId, tenantId),
        inArray(radacct.username, usernames),
        isNull(radacct.acctstoptime)
      )
    );

    if (activeSessions.length > 0) {
      const nasRecords = await db.select().from(nas).where(eq(nas.tenantId, tenantId));
      const nasMap = new Map(nasRecords.map(n => [n.nasname, n.secret]));

      for (const session of activeSessions) {
        if (session.nasipaddress) {
          const secret = nasMap.get(session.nasipaddress);
          if (secret) {
            try {
              await RadiusCoAService.disconnectUser({ ip: session.nasipaddress, secret }, session.username);
            } catch (e) {
              request.log.warn(`Failed to disconnect ${session.username} on ${session.nasipaddress}`);
            }
          }
        }
      }
    }
  } catch (error) {
    request.log.error(error);
  }
}

export const bulkDisableUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  const { tenantId } = request.user as { tenantId: string };
  const { usernames } = request.body as { usernames: string[] };

  if (!usernames || usernames.length === 0) {
    return reply.status(400).send({ error: "No users provided" });
  }

  try {
    // 1. Check existing Reject records
    const existingRejects = await db.select({ username: radcheck.username })
      .from(radcheck)
      .where(
        and(
          eq(radcheck.tenantId, tenantId),
          inArray(radcheck.username, usernames),
          eq(radcheck.attribute, "Auth-Type"),
          eq(radcheck.value, "Reject")
        )
      );
      
    const existingRejectUsers = new Set(existingRejects.map(r => r.username));
    
    // 2. Filter users that don't have Reject yet
    const usersToSuspend = usernames.filter(u => !existingRejectUsers.has(u));

    if (usersToSuspend.length > 0) {
      // 3. Insert Auth-Type = Reject
      await db.insert(radcheck).values(
        usersToSuspend.map(username => ({
          username,
          attribute: "Auth-Type",
          op: ":=",
          value: "Reject",
          tenantId
        }))
      );
    }
    
    // 4. Disconnect active sessions
    await disconnectActiveUsers(tenantId, usernames, request);

    return reply.send({ success: true, count: usernames.length, message: `Successfully suspended ${usernames.length} users` });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to bulk suspend users" });
  }
};

export const bulkEnableUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  const { tenantId } = request.user as { tenantId: string };
  const { usernames } = request.body as { usernames: string[] };

  if (!usernames || usernames.length === 0) {
    return reply.status(400).send({ error: "No users provided" });
  }

  try {
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

export const bulkDeleteUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  const { tenantId } = request.user as { tenantId: string };
  const { usernames } = request.body as { usernames: string[] };

  if (!usernames || usernames.length === 0) {
    return reply.status(400).send({ error: "No users provided" });
  }

  try {
    // Soft delete in radcheck
    await db.update(radcheck)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(radcheck.tenantId, tenantId),
          inArray(radcheck.username, usernames)
        )
      );
      
    // Disconnect active sessions
    await disconnectActiveUsers(tenantId, usernames, request);

    return reply.send({ success: true, count: usernames.length, message: `Successfully deleted ${usernames.length} users` });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to bulk delete users" });
  }
};

export const bulkTransferUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  const { tenantId } = request.user as { tenantId: string };
  const { usernames, targetGroupId } = request.body as { usernames: string[], targetGroupId: string };

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
    await db.delete(userOrganizations).where(
      and(
        eq(userOrganizations.tenantId, tenantId),
        inArray(userOrganizations.username, usernames)
      )
    );
    
    await db.insert(userOrganizations).values(
      usernames.map(username => ({
        tenantId,
        username,
        organizationId: targetGroupId
      }))
    );

    return reply.send({ success: true, count: usernames.length, message: `Successfully transferred ${usernames.length} users` });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to bulk transfer users" });
  }
};
