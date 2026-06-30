import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { tenantPortalSettings } from "../schema/portal";
import { tenants } from "../schema/tenants";
import { radcheck, radusergroup, radreply } from "../schema/freeradius";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// --- Validation Schemas ---
export const updateSettingsSchema = z.object({
  orgName: z.string().min(1).max(255),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")),
  termsOfService: z.string().optional().or(z.literal("")),
  footerNote: z.string().optional().or(z.literal("")),
  isRegisterEnabled: z.boolean(),
  isSocialLoginEnabled: z.boolean(),
  themeColor: z.string().max(10).regex(/^#[0-9a-fA-F]{3,6}$/, "Invalid HEX color"),
});

export const registerUserSchema = z.object({
  username: z.string().min(4).max(64),
  password: z.string().min(4).max(64),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

// --- Controllers ---

/**
 * Public endpoint to fetch portal settings by tenantId
 */
export const getPortalSettings = async (
  request: FastifyRequest<{ Params: { tenantId: string } }>,
  reply: FastifyReply
) => {
  const { tenantId } = request.params;
  
  if (!tenantId) {
    return reply.code(400).send({ error: "Tenant ID is required" });
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });
  
  if (!tenant) {
    return reply.code(404).send({ error: "Tenant not found" });
  }

  let settings = await db.query.tenantPortalSettings.findFirst({
    where: eq(tenantPortalSettings.tenantId, tenantId),
  });

  const responsePayload = {
    tenantId: tenant.id,
    primaryDeviceType: tenant.primaryDeviceType,
    orgName: settings?.orgName || tenant.name,
    logoUrl: settings?.logoUrl || "",
    termsOfService: settings?.termsOfService || "",
    footerNote: settings?.footerNote || "",
    isRegisterEnabled: settings?.isRegisterEnabled ?? true,
    isSocialLoginEnabled: settings?.isSocialLoginEnabled ?? true,
    themeColor: settings?.themeColor || "#3b82f6",
  };

  return reply.send(responsePayload);
};

/**
 * Protected endpoint to update portal settings
 */
export const updatePortalSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;
  const tenantId = user.tenantId; // from JWT token
  const body = request.body as z.infer<typeof updateSettingsSchema>;

  const existing = await db.query.tenantPortalSettings.findFirst({
    where: eq(tenantPortalSettings.tenantId, tenantId),
  });

  if (existing) {
    const [updated] = await db.update(tenantPortalSettings).set({
      ...body,
      updatedAt: new Date(),
    }).where(eq(tenantPortalSettings.tenantId, tenantId)).returning();
    return reply.send(updated);
  } else {
    const [inserted] = await db.insert(tenantPortalSettings).values({
      tenantId,
      ...body,
    }).returning();
    return reply.status(201).send(inserted);
  }
};

/**
 * Public endpoint for Self-Registration
 */
export const registerUser = async (
  request: FastifyRequest<{ Params: { tenantId: string } }>,
  reply: FastifyReply
) => {
  const { tenantId } = request.params;
  const body = request.body as z.infer<typeof registerUserSchema>;

  // 1. Check if Tenant and Portal Settings allow registration
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) {
    return reply.code(404).send({ error: "Tenant not found" });
  }

  if (tenant.status !== "active") {
    return reply.code(403).send({ error: "Tenant account is suspended" });
  }

  const settings = await db.query.tenantPortalSettings.findFirst({
    where: eq(tenantPortalSettings.tenantId, tenantId),
  });

  if (settings && !settings.isRegisterEnabled) {
    return reply.code(403).send({ error: "Self-Registration is disabled for this tenant" });
  }

  if (!tenant.defaultRegisterProfile) {
    return reply.code(400).send({ error: "Tenant has not configured a default register profile. Registration is unavailable." });
  }

  // 2. Check if username already exists in this tenant
  const existingUser = await db.query.radcheck.findFirst({
    where: and(
      eq(radcheck.tenantId, tenantId),
      eq(radcheck.username, body.username)
    ),
  });

  if (existingUser) {
    return reply.code(409).send({ error: "Username already exists" });
  }

  // 3. Insert into Database using transaction
  try {
    await db.transaction(async (tx) => {
      // Create user auth record
      await tx.insert(radcheck).values({
        tenantId,
        username: body.username,
        attribute: "Cleartext-Password",
        op: ":=",
        value: body.password,
      });

      // Bind to default profile
      await tx.insert(radusergroup).values({
        tenantId,
        username: body.username,
        groupname: tenant.defaultRegisterProfile!,
        priority: 1,
      });

      // Store additional details in radreply (Custom or Informational attributes)
      // This is a common way to store extra info if a dedicated 'users' table is not present
      if (body.firstName) {
        await tx.insert(radreply).values({
          tenantId, username: body.username, attribute: "User-First-Name", op: "=", value: body.firstName
        });
      }
      if (body.lastName) {
        await tx.insert(radreply).values({
          tenantId, username: body.username, attribute: "User-Last-Name", op: "=", value: body.lastName
        });
      }
      if (body.phone) {
        await tx.insert(radreply).values({
          tenantId, username: body.username, attribute: "User-Phone", op: "=", value: body.phone
        });
      }
    });

    return reply.code(201).send({ message: "Registration successful" });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Internal server error during registration" });
  }
};
