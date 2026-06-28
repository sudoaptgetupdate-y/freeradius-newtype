import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { radcheck, radacct, radusergroup } from "../schema/freeradius";
import { eq, and, isNull, not } from "drizzle-orm";
import { z } from "zod";

const userSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
  profileName: z.string().min(1),
  tenantId: z.string().optional(),
});

const userUpdateSchema = z.object({
  password: z.string().min(4).optional(),
  profileName: z.string().min(1).optional(),
});

export const getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;

    // Get unique usernames from radcheck (filtering by password attribute to avoid duplicates if possible)
    let usersQuery = db
      .select({
        id: radcheck.id,
        username: radcheck.username,
        tenantId: radcheck.tenantId,
      })
      .from(radcheck)
      .where(eq(radcheck.attribute, 'Cleartext-Password'))
      .limit(50); // Hardcoded limit for now to prevent massive scans

    if (user.role !== 'super_admin') {
      usersQuery = db
        .select({
          id: radcheck.id,
          username: radcheck.username,
          tenantId: radcheck.tenantId,
        })
        .from(radcheck)
        .where(
          and(
            eq(radcheck.attribute, 'Cleartext-Password'),
            eq(radcheck.tenantId, user.tenantId)
          )
        )
        .limit(50);
    }

    const radcheckUsers = await usersQuery;

    // Now for each user, check if they are online in radacct
    // This is a naive approach (N+1), but acceptable for a quick 50-limit list without complex subqueries
    const userList = await Promise.all(
      radcheckUsers.map(async (u) => {
        const activeSessionRes = await db
          .select({
            nasipaddress: radacct.nasipaddress,
            framedipaddress: radacct.framedipaddress,
            callingstationid: radacct.callingstationid, // MAC Address usually
            acctinputoctets: radacct.acctinputoctets,
            acctoutputoctets: radacct.acctoutputoctets,
          })
          .from(radacct)
          .where(
            and(
              eq(radacct.username, u.username),
              eq(radacct.tenantId, u.tenantId),
              isNull(radacct.acctstoptime)
            )
          )
          .limit(1);

        const activeSession = activeSessionRes[0];

        // Fetch user's profile
        const profileRes = await db.select().from(radusergroup).where(and(eq(radusergroup.username, u.username), eq(radusergroup.tenantId, u.tenantId))).limit(1);
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
        } else {
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
      })
    );

    return reply.send({ users: userList });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
};

export const createUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const data = userSchema.parse(request.body);

    const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? data.tenantId : user.tenantId;

    if (!targetTenantId) {
      return reply.status(400).send({ error: "Tenant ID is required" });
    }

    // Check duplicate
    const existing = await db.select().from(radcheck).where(
      and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, data.username))
    ).limit(1);

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

    // Insert into radusergroup
    await db.insert(radusergroup).values({
      tenantId: targetTenantId,
      username: data.username,
      groupname: data.profileName,
      priority: 1
    });

    reply.status(201).send({ message: "User created successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Validation error", details: error.errors });
    }
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const updateUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { username } = request.params as { username: string };
    const data = userUpdateSchema.parse(request.body);
    const query = request.query as { tenantId?: string };
    
    const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? query.tenantId : user.tenantId;

    if (!targetTenantId) {
      return reply.status(400).send({ error: "Tenant ID is required" });
    }

    if (data.password) {
      await db.update(radcheck).set({ value: data.password }).where(
        and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, username), eq(radcheck.attribute, "Cleartext-Password"))
      );
    }

    if (data.profileName) {
      await db.update(radusergroup).set({ groupname: data.profileName }).where(
        and(eq(radusergroup.tenantId, targetTenantId), eq(radusergroup.username, username))
      );
    }

    reply.send({ message: "User updated successfully" });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const deleteUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { username } = request.params as { username: string };
    const query = request.query as { tenantId?: string };
    
    const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? query.tenantId : user.tenantId;

    if (!targetTenantId) {
      return reply.status(400).send({ error: "Tenant ID is required" });
    }

    await db.delete(radcheck).where(
      and(eq(radcheck.tenantId, targetTenantId), eq(radcheck.username, username))
    );
    await db.delete(radusergroup).where(
      and(eq(radusergroup.tenantId, targetTenantId), eq(radusergroup.username, username))
    );

    reply.send({ message: "User deleted successfully" });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};
