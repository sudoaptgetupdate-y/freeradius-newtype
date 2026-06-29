import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { radcheck, radacct, radusergroup } from "../schema/freeradius";
import { eq, and, isNull, not, sql, desc } from "drizzle-orm";
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

    const userList = await Promise.all(
      radcheckUsers.map(async (u) => {
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
          .where(
            and(
              eq(radacct.username, u.username),
              eq(radacct.tenantId, u.tenantId),
              isNull(radacct.acctstoptime)
            )
          )
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
          .where(
            and(
              eq(radacct.username, u.username),
              eq(radacct.tenantId, u.tenantId)
            )
          )
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

        return {
          id: String(u.id),
          username: u.username,
          mac: lastSession?.callingstationid || "-",
          ip: lastSession?.framedipaddress || "-",
          dataUsage: `${usageMB} MB`,
          status: isOnline ? "online" : "offline",
          isOnline,
          profileName,
          tenantId: u.tenantId,
        };
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

export const getUserDetails = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authUser = request.user as any;
    const { username } = request.params as { username: string };
    const query = request.query as { tenantId?: string };

    const targetTenantId = (authUser.role === "super_admin" || authUser.role === "admin") ? query.tenantId : authUser.tenantId;

    if (!targetTenantId) {
      return reply.status(400).send({ error: "Tenant ID is required" });
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
    const statsQuery = await db.execute(sql`
      SELECT 
        SUM(COALESCE(acctinputoctets, 0) + COALESCE(acctoutputoctets, 0))::bigint as "totalBytes",
        SUM(COALESCE(acctsessiontime, 0))::bigint as "totalDuration",
        MAX(acctstarttime) as "lastLogin"
      FROM radacct
      WHERE username = ${username} AND tenant_id = ${targetTenantId}::uuid
    `);
    
    const stats = statsQuery[0] || { totalBytes: 0, totalDuration: 0, lastLogin: null };

    // Get unique MAC addresses
    const macsQuery = await db.execute(sql`
      SELECT DISTINCT callingstationid as "mac"
      FROM radacct
      WHERE username = ${username} AND tenant_id = ${targetTenantId}::uuid AND callingstationid IS NOT NULL AND callingstationid != ''
    `);
    const macs = macsQuery.map((r: any) => r.mac);

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
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
};
