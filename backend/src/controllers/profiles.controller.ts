import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { radgroupreply, radgroupcheck, radusergroup } from "../schema/freeradius";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Profile name is required"),
  downloadSpeed: z.string().optional(), // e.g. "10M"
  uploadSpeed: z.string().optional(),   // e.g. "10M"
  sessionTimeout: z.number().optional(), // in seconds
  sharedUsers: z.number().optional(),    // Simultaneous-Use
  tenantId: z.string().optional(),       // Required if super admin
});

const updateProfileSchema = profileSchema.extend({
  oldName: z.string().min(1, "Old profile name is required"),
});

export const getProfiles = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    
    // Fetch all attributes for this tenant
    let replyAttrs, checkAttrs;
    if (user.role === "super_admin" || user.role === "admin") {
      replyAttrs = await db.select().from(radgroupreply);
      checkAttrs = await db.select().from(radgroupcheck);
    } else {
      replyAttrs = await db.select().from(radgroupreply).where(eq(radgroupreply.tenantId, user.tenantId));
      checkAttrs = await db.select().from(radgroupcheck).where(eq(radgroupcheck.tenantId, user.tenantId));
    }

    // Group by groupname
    const profilesMap = new Map<string, any>();
    
    const initProfile = (name: string, tenantId: string | null) => {
      // Use tenantId + name as composite key for map if super admin, but returning list just needs to include tenantId
      const key = `${tenantId}_${name}`;
      if (!profilesMap.has(key)) {
        profilesMap.set(key, {
          name,
          tenantId,
          downloadSpeed: "",
          uploadSpeed: "",
          sessionTimeout: null,
          sharedUsers: null
        });
      }
      return profilesMap.get(key);
    };

    // Process radgroupreply
    replyAttrs.forEach(row => {
      const p = initProfile(row.groupname, row.tenantId);
      if (row.attribute === "Mikrotik-Rate-Limit") {
        // Mikrotik format: rx/tx e.g. 10M/10M (Upload/Download)
        const parts = row.value.split("/");
        if (parts.length === 2) {
          p.uploadSpeed = parts[0];
          p.downloadSpeed = parts[1];
        }
      }
    });

    // Process radgroupcheck
    checkAttrs.forEach(row => {
      const p = initProfile(row.groupname, row.tenantId);
      if (row.attribute === "Simultaneous-Use") {
        p.sharedUsers = parseInt(row.value, 10);
      } else if (row.attribute === "Session-Timeout") {
        p.sessionTimeout = parseInt(row.value, 10);
      }
    });

    const profilesList = Array.from(profilesMap.values());
    reply.send(profilesList);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const createProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const data = profileSchema.parse(request.body);

    const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? data.tenantId : user.tenantId;

    if (!targetTenantId) {
      return reply.status(400).send({ error: "Tenant ID is required" });
    }

    // Check if profile exists
    const existing = await db.select().from(radgroupreply).where(
      and(eq(radgroupreply.tenantId, targetTenantId), eq(radgroupreply.groupname, data.name))
    ).limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Profile name already exists for this tenant" });
    }

    // Prepare inserts
    if (data.downloadSpeed && data.uploadSpeed) {
      await db.insert(radgroupreply).values({
        tenantId: targetTenantId,
        groupname: data.name,
        attribute: "Mikrotik-Rate-Limit",
        op: "=",
        value: `${data.uploadSpeed}/${data.downloadSpeed}`
      });
    }

    if (data.sharedUsers) {
      await db.insert(radgroupcheck).values({
        tenantId: targetTenantId,
        groupname: data.name,
        attribute: "Simultaneous-Use",
        op: ":=",
        value: data.sharedUsers.toString()
      });
    }

    if (data.sessionTimeout) {
      await db.insert(radgroupcheck).values({
        tenantId: targetTenantId,
        groupname: data.name,
        attribute: "Session-Timeout",
        op: ":=",
        value: data.sessionTimeout.toString()
      });
    }

    reply.status(201).send({ message: "Profile created successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Validation error", details: error.errors });
    }
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const updateProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const data = updateProfileSchema.parse(request.body);

    const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? data.tenantId : user.tenantId;

    if (!targetTenantId) {
      return reply.status(400).send({ error: "Tenant ID is required" });
    }

    // Ensure the old profile exists
    const existing = await db.select().from(radgroupreply).where(
      and(eq(radgroupreply.tenantId, targetTenantId), eq(radgroupreply.groupname, data.oldName))
    ).limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: "Profile not found" });
    }

    // If name is changing, ensure new name doesn't exist
    if (data.name !== data.oldName) {
      const nameConflict = await db.select().from(radgroupreply).where(
        and(eq(radgroupreply.tenantId, targetTenantId), eq(radgroupreply.groupname, data.name))
      ).limit(1);
      
      if (nameConflict.length > 0) {
        return reply.status(409).send({ error: "New profile name already exists" });
      }
    }

    // Start transaction or simply perform multiple updates
    await db.transaction(async (tx) => {
      // 1. Delete all existing attributes for this group in radgroupcheck and radgroupreply
      await tx.delete(radgroupreply).where(
        and(eq(radgroupreply.tenantId, targetTenantId), eq(radgroupreply.groupname, data.oldName))
      );
      await tx.delete(radgroupcheck).where(
        and(eq(radgroupcheck.tenantId, targetTenantId), eq(radgroupcheck.groupname, data.oldName))
      );

      // 2. Insert new attributes with the (potentially new) name
      if (data.downloadSpeed && data.uploadSpeed) {
        await tx.insert(radgroupreply).values({
          tenantId: targetTenantId,
          groupname: data.name,
          attribute: "Mikrotik-Rate-Limit",
          op: "=",
          value: `${data.uploadSpeed}/${data.downloadSpeed}`
        });
      }
  
      if (data.sharedUsers) {
        await tx.insert(radgroupcheck).values({
          tenantId: targetTenantId,
          groupname: data.name,
          attribute: "Simultaneous-Use",
          op: ":=",
          value: data.sharedUsers.toString()
        });
      }
  
      if (data.sessionTimeout) {
        await tx.insert(radgroupcheck).values({
          tenantId: targetTenantId,
          groupname: data.name,
          attribute: "Session-Timeout",
          op: ":=",
          value: data.sessionTimeout.toString()
        });
      }

      // 3. Update radusergroup if the name has changed
      if (data.name !== data.oldName) {
        await tx.update(radusergroup)
          .set({ groupname: data.name })
          .where(and(eq(radusergroup.tenantId, targetTenantId), eq(radusergroup.groupname, data.oldName)));
      }
    });

    reply.send({ message: "Profile updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Validation error", details: error.errors });
    }
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const deleteProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const query = request.query as { name?: string; tenantId?: string };
    
    if (!query.name) {
      return reply.status(400).send({ error: "Profile name is required in query" });
    }
    
    const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? query.tenantId : user.tenantId;

    if (!targetTenantId) {
      return reply.status(400).send({ error: "Tenant ID is required to delete a profile" });
    }

    // Check if profile is being used by any users
    const usersInGroup = await db.select().from(radusergroup).where(
      and(eq(radusergroup.tenantId, targetTenantId), eq(radusergroup.groupname, query.name))
    ).limit(1);

    if (usersInGroup.length > 0) {
      return reply.status(400).send({ error: "Cannot delete profile because it is currently assigned to users. Please reassign or delete the users first." });
    }

    await db.delete(radgroupreply).where(
      and(eq(radgroupreply.tenantId, targetTenantId), eq(radgroupreply.groupname, query.name))
    );
    await db.delete(radgroupcheck).where(
      and(eq(radgroupcheck.tenantId, targetTenantId), eq(radgroupcheck.groupname, query.name))
    );

    reply.send({ message: "Profile deleted successfully" });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};
