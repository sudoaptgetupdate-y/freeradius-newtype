import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { radgroupreply, radgroupcheck, radusergroup } from "../schema/freeradius";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const advancedAttributeSchema = z.object({
  attribute: z.string().min(1, "Attribute name is required"),
  op: z.string().min(1, "Operator is required"),
  value: z.string(),
  type: z.enum(["check", "reply"])
});

const profileSchema = z.object({
  name: z.string().min(1, "Profile name is required"),
  downloadSpeed: z.string().optional(), // e.g. "10M"
  uploadSpeed: z.string().optional(),   // e.g. "10M"
  sessionTimeout: z.number().optional(), // in seconds
  sharedUsers: z.number().optional(),    // Simultaneous-Use
  vlanId: z.string().optional(),         // Tunnel-Private-Group-Id
  fortiGroupName: z.string().optional(), // Fortinet-Group-Name
  advancedAttributes: z.array(advancedAttributeSchema).optional(),
  tenantId: z.string().optional(),       // Required if super admin
});

const updateProfileSchema = profileSchema.extend({
  oldName: z.string().min(1, "Old profile name is required"),
});

export const getProfiles = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const effectiveTenantId: string | null = user.tenantId ?? null;

    let replyAttrs, checkAttrs;
    if (effectiveTenantId) {
      replyAttrs = await db.select().from(radgroupreply).where(eq(radgroupreply.tenantId, effectiveTenantId));
      checkAttrs = await db.select().from(radgroupcheck).where(eq(radgroupcheck.tenantId, effectiveTenantId));
    } else {
      replyAttrs = await db.select().from(radgroupreply);
      checkAttrs = await db.select().from(radgroupcheck);
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
          sharedUsers: null,
          vlanId: "",
          fortiGroupName: "",
          advancedAttributes: [] as { attribute: string, op: string, value: string, type: 'check' | 'reply' }[]
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
      } else if (row.attribute === "Tunnel-Private-Group-Id") {
        p.vlanId = row.value;
      } else if (row.attribute === "Fortinet-Group-Name") {
        p.fortiGroupName = row.value;
      } else if (row.attribute !== "Tunnel-Type" && row.attribute !== "Tunnel-Medium-Type" && row.attribute !== "Class") {
        p.advancedAttributes.push({ attribute: row.attribute, op: row.op, value: row.value, type: 'reply' });
      }
    });

    // Process radgroupcheck
    checkAttrs.forEach(row => {
      const p = initProfile(row.groupname, row.tenantId);
      if (row.attribute === "Simultaneous-Use") {
        p.sharedUsers = parseInt(row.value, 10);
      } else if (row.attribute === "Session-Timeout") {
        p.sessionTimeout = parseInt(row.value, 10);
      } else {
        p.advancedAttributes.push({ attribute: row.attribute, op: row.op, value: row.value, type: 'check' });
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
    const targetTenantId: string | null = user.tenantId || (request.body as any).tenantId || null;

    if (!targetTenantId) {
      return reply.status(400).send({ error: "Tenant context is required. Super Admin must provide a tenantId." });
    }

    // Check if profile exists
    const existing = await db.select().from(radgroupreply).where(
      and(eq(radgroupreply.tenantId, targetTenantId), eq(radgroupreply.groupname, data.name))
    ).limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Profile name already exists for this tenant" });
    }

    // Prepare inserts
    // Always insert a marker attribute so the profile exists even if empty
    await db.insert(radgroupreply).values({
      tenantId: targetTenantId,
      groupname: data.name,
      attribute: "Class",
      op: "=",
      value: data.name
    });

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

    if (data.vlanId) {
      await db.insert(radgroupreply).values([
        { tenantId: targetTenantId, groupname: data.name, attribute: "Tunnel-Type", op: "=", value: "VLAN" },
        { tenantId: targetTenantId, groupname: data.name, attribute: "Tunnel-Medium-Type", op: "=", value: "IEEE-802" },
        { tenantId: targetTenantId, groupname: data.name, attribute: "Tunnel-Private-Group-Id", op: "=", value: data.vlanId }
      ]);
    }

    if (data.fortiGroupName) {
      await db.insert(radgroupreply).values({
        tenantId: targetTenantId,
        groupname: data.name,
        attribute: "Fortinet-Group-Name",
        op: "=",
        value: data.fortiGroupName
      });
    }

    if (data.advancedAttributes && data.advancedAttributes.length > 0) {
      const checkInserts = data.advancedAttributes.filter(a => a.type === 'check').map(a => ({
        tenantId: targetTenantId, groupname: data.name, attribute: a.attribute, op: a.op, value: a.value
      }));
      const replyInserts = data.advancedAttributes.filter(a => a.type === 'reply').map(a => ({
        tenantId: targetTenantId, groupname: data.name, attribute: a.attribute, op: a.op, value: a.value
      }));

      if (checkInserts.length > 0) await db.insert(radgroupcheck).values(checkInserts);
      if (replyInserts.length > 0) await db.insert(radgroupreply).values(replyInserts);
    }

    reply.status(201).send({ message: "Profile created successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Validation error", details: error.issues });
    }
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const updateProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const data = updateProfileSchema.parse(request.body);
    const targetTenantId: string | null = user.tenantId || (request.body as any).tenantId || null;

    if (!targetTenantId) {
      return reply.status(400).send({ error: "Tenant context is required. Super Admin must provide a tenantId." });
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
      // Always insert a marker attribute so the profile exists even if empty
      await tx.insert(radgroupreply).values({
        tenantId: targetTenantId,
        groupname: data.name,
        attribute: "Class",
        op: "=",
        value: data.name
      });

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

      if (data.vlanId) {
        await tx.insert(radgroupreply).values([
          { tenantId: targetTenantId, groupname: data.name, attribute: "Tunnel-Type", op: "=", value: "VLAN" },
          { tenantId: targetTenantId, groupname: data.name, attribute: "Tunnel-Medium-Type", op: "=", value: "IEEE-802" },
          { tenantId: targetTenantId, groupname: data.name, attribute: "Tunnel-Private-Group-Id", op: "=", value: data.vlanId }
        ]);
      }
  
      if (data.fortiGroupName) {
        await tx.insert(radgroupreply).values({
          tenantId: targetTenantId,
          groupname: data.name,
          attribute: "Fortinet-Group-Name",
          op: "=",
          value: data.fortiGroupName
        });
      }

      if (data.advancedAttributes && data.advancedAttributes.length > 0) {
        const checkInserts = data.advancedAttributes.filter(a => a.type === 'check').map(a => ({
          tenantId: targetTenantId, groupname: data.name, attribute: a.attribute, op: a.op, value: a.value
        }));
        const replyInserts = data.advancedAttributes.filter(a => a.type === 'reply').map(a => ({
          tenantId: targetTenantId, groupname: data.name, attribute: a.attribute, op: a.op, value: a.value
        }));
  
        if (checkInserts.length > 0) await tx.insert(radgroupcheck).values(checkInserts);
        if (replyInserts.length > 0) await tx.insert(radgroupreply).values(replyInserts);
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
      return reply.status(400).send({ error: "Validation error", details: error.issues });
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
    const targetTenantId: string | null = user.tenantId || (request.query as any).tenantId || null;

    if (!targetTenantId) {
      return reply.status(400).send({ error: "Tenant context is required. Super Admin must provide a tenantId." });
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
