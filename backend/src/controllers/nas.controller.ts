import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { nas } from "../schema/nas";
import { eq, and, or, not } from "drizzle-orm";
import { z } from "zod";
import { MikrotikService } from "../services/mikrotik.service";
import { RadiusCoAService } from "../services/radius-coa.service";

const nasSchema = z.object({
  nasname: z.string().max(128),
  shortname: z.string().max(32),
  type: z.string().max(30).default("other"),
  secret: z.string().max(60),
  apiUsername: z.string().max(255).optional(),
  apiPasswordEncrypted: z.string().max(512).optional(),
  description: z.string().max(200).optional(),
  tenantId: z.string().uuid().optional(),
});

export const getNasList = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    
    // Superadmin should view all NAS devices across all tenants.
    // Tenant Admin only views their own.
    let allNas;
    if (user.role === "super_admin" || user.role === "admin") {
      allNas = await db.select().from(nas);
    } else {
      allNas = await db.select().from(nas).where(eq(nas.tenantId, user.tenantId));
    }
    reply.send(allNas);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Failed to fetch NAS devices" });
  }
};

export const createNas = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const data = nasSchema.parse(request.body);
    
    if (user.role === "super_admin" && !data.tenantId) {
      return reply.status(400).send({ error: "Validation error", message: "Super admin must provide a tenantId" });
    }

    const tenantIdToUse = user.role === "super_admin" ? data.tenantId! : user.tenantId;

    // Check for duplicates
    const existingNas = await db.select().from(nas).where(
      or(
        eq(nas.nasname, data.nasname),
        and(eq(nas.shortname, data.shortname), eq(nas.tenantId, tenantIdToUse))
      )
    ).limit(1);

    if (existingNas.length > 0) {
      if (existingNas[0].nasname === data.nasname) {
        return reply.status(409).send({ error: "Conflict", message: "IP Address (NASName) already exists in the system" });
      }
      return reply.status(409).send({ error: "Conflict", message: "Shortname already exists in this tenant" });
    }

    const [newNas] = await db.insert(nas).values({
      ...data,
      tenantId: tenantIdToUse
    }).returning();
    
    reply.status(201).send(newNas);
  } catch (error: any) {
    request.log.error(error);
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Validation error", details: error.errors });
    }
    reply.status(500).send({ error: "Failed to create NAS" });
  }
};

export const updateNas = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { id } = request.params;
    const data = nasSchema.partial().parse(request.body);
    
    // Check for duplicates on update
    if (data.nasname || data.shortname) {
      const currentNasQuery = user.role === "super_admin" || user.role === "admin"
        ? eq(nas.id, parseInt(id))
        : and(eq(nas.id, parseInt(id)), eq(nas.tenantId, user.tenantId));
        
      const currentNas = await db.select().from(nas).where(currentNasQuery).limit(1);
      if (currentNas.length === 0) {
        return reply.status(404).send({ error: "NAS not found or access denied" });
      }

      const duplicateCheck = await db.select().from(nas).where(
        and(
          not(eq(nas.id, parseInt(id))),
          or(
            data.nasname ? eq(nas.nasname, data.nasname) : undefined,
            data.shortname ? and(eq(nas.shortname, data.shortname), eq(nas.tenantId, currentNas[0].tenantId)) : undefined
          )
        )
      ).limit(1);

      if (duplicateCheck.length > 0) {
        if (data.nasname && duplicateCheck[0].nasname === data.nasname) {
          return reply.status(409).send({ error: "Conflict", message: "IP Address (NASName) already exists in the system" });
        }
        return reply.status(409).send({ error: "Conflict", message: "Shortname already exists in this tenant" });
      }
    }

    const updateQuery = user.role === "super_admin" || user.role === "admin"
      ? eq(nas.id, parseInt(id))
      : and(eq(nas.id, parseInt(id)), eq(nas.tenantId, user.tenantId));

    const [updatedNas] = await db
      .update(nas)
      .set({ ...data, updatedAt: new Date() })
      .where(updateQuery)
      .returning();

    if (!updatedNas) {
      return reply.status(404).send({ error: "NAS not found or access denied" });
    }
    reply.send(updatedNas);
  } catch (error: any) {
    request.log.error(error);
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Validation error", details: error.errors });
    }
    reply.status(500).send({ error: "Failed to update NAS" });
  }
};

export const deleteNas = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { id } = request.params;
    
    // NAS deletion is usually a hard delete, or we might need soft delete if we want to keep acct records?
    // According to SKILL.md, core entities with relations (like NAS used in radacct via nasipaddress) 
    // Wait, FreeRADIUS radacct uses `nasipaddress` string, not `nas.id`. So deleting NAS doesn't break radacct FKs.
    // We will do a hard delete for NAS since it's just the authentication configuration for FreeRADIUS.
    const deleteQuery = user.role === "super_admin" || user.role === "admin"
      ? eq(nas.id, parseInt(id))
      : and(eq(nas.id, parseInt(id)), eq(nas.tenantId, user.tenantId));

    const [deletedNas] = await db
      .delete(nas)
      .where(deleteQuery)
      .returning();

    if (!deletedNas) {
      return reply.status(404).send({ error: "NAS not found or access denied" });
    }
    reply.send({ success: true, message: "NAS deleted" });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Failed to delete NAS" });
  }
};

export const getNasStatus = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { id } = request.params;
    
    const query = user.role === "super_admin" || user.role === "admin"
      ? eq(nas.id, parseInt(id))
      : and(eq(nas.id, parseInt(id)), eq(nas.tenantId, user.tenantId));
      
    const [targetNas] = await db.select().from(nas).where(query).limit(1);

    if (!targetNas) {
      return reply.status(404).send({ error: "NAS not found or access denied" });
    }

    if (targetNas.type !== "mikrotik") {
      return reply.status(400).send({ error: "Status check only supported for Mikrotik devices" });
    }

    if (!targetNas.apiUsername || !targetNas.apiPasswordEncrypted) {
      return reply.status(400).send({ error: "Mikrotik API credentials not configured for this NAS" });
    }

    const status = await MikrotikService.getSystemResource({
      ip: targetNas.nasname,
      username: targetNas.apiUsername,
      password: targetNas.apiPasswordEncrypted,
    });

    reply.send({ success: true, data: status });
  } catch (error: any) {
    request.log.error(error);
    reply.status(500).send({ error: "Failed to fetch NAS status", message: error.message });
  }
};

export const getNasDhcp = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { id } = request.params;
    
    const query = user.role === "super_admin" || user.role === "admin"
      ? eq(nas.id, parseInt(id))
      : and(eq(nas.id, parseInt(id)), eq(nas.tenantId, user.tenantId));
      
    const [targetNas] = await db.select().from(nas).where(query).limit(1);

    if (!targetNas) {
      return reply.status(404).send({ error: "NAS not found or access denied" });
    }

    if (targetNas.type !== "mikrotik") {
      return reply.status(400).send({ error: "DHCP leases only supported for Mikrotik devices" });
    }

    if (!targetNas.apiUsername || !targetNas.apiPasswordEncrypted) {
      return reply.status(400).send({ error: "Mikrotik API credentials not configured for this NAS" });
    }

    const leases = await MikrotikService.getDhcpLeases({
      ip: targetNas.nasname,
      username: targetNas.apiUsername,
      password: targetNas.apiPasswordEncrypted,
    });

    reply.send({ success: true, data: leases });
  } catch (error: any) {
    request.log.error(error);
    reply.status(500).send({ error: "Failed to fetch DHCP leases", message: error.message });
  }
};

export const kickNasUser = async (request: FastifyRequest<{ Params: { id: string }, Body: { username: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { id } = request.params;
    
    const { username } = z.object({ username: z.string() }).parse(request.body);
    
    const query = user.role === "super_admin" || user.role === "admin"
      ? eq(nas.id, parseInt(id))
      : and(eq(nas.id, parseInt(id)), eq(nas.tenantId, user.tenantId));
      
    const [targetNas] = await db.select().from(nas).where(query).limit(1);

    if (!targetNas) {
      return reply.status(404).send({ error: "NAS not found or access denied" });
    }

    // Attempt RADIUS CoA Disconnect
    const success = await RadiusCoAService.disconnectUser({
      ip: targetNas.nasname,
      secret: targetNas.secret,
      port: 3799
    }, username);

    if (success) {
      return reply.send({ success: true, message: `Successfully sent Disconnect-Request for user ${username}` });
    } else {
      // If CoA fails, optionally try REST API kick if Mikrotik credentials exist
      if (targetNas.type === "mikrotik" && targetNas.apiUsername && targetNas.apiPasswordEncrypted) {
        const fallbackRes = await MikrotikService.kickHotspotUser({
          ip: targetNas.nasname,
          username: targetNas.apiUsername,
          password: targetNas.apiPasswordEncrypted
        }, username);
        return reply.send(fallbackRes);
      }
      return reply.status(500).send({ success: false, error: "Failed to disconnect user via RADIUS CoA and no API fallback available" });
    }
  } catch (error: any) {
    request.log.error(error);
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Validation error", details: error.errors });
    }
    reply.status(500).send({ error: "Failed to kick user", message: error.message });
  }
};

