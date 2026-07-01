import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { tenantPortalSettings } from "../schema/portal";
import { tenants } from "../schema/tenants";
import { radcheck, radusergroup, radreply } from "../schema/freeradius";
import { userinfo } from "../schema/userinfo";
import { userOrganizations } from "../schema/organizations";
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
  welcomeMessage: z.string().optional().or(z.literal("")),
  leftBgColor: z.string().max(10).regex(/^#[0-9a-fA-F]{3,6}$/, "Invalid HEX color"),
  leftTextColor: z.string().max(10).regex(/^#[0-9a-fA-F]{3,6}$/, "Invalid HEX color"),
  leftAccentColor: z.string().max(10).regex(/^#[0-9a-fA-F]{3,6}$/, "Invalid HEX color"),
  tenantId: z.string().optional(),
  googleClientIdOverride: z.string().optional().nullable(),
  googleClientSecretOverride: z.string().optional().nullable(),
  lineChannelIdOverride: z.string().optional().nullable(),
  lineChannelSecretOverride: z.string().optional().nullable(),
  telegramEnabled: z.boolean().optional(),
  telegramChatId: z.string().max(100).optional().nullable(),
  trashRetentionDays: z.number().min(1).max(365).optional().default(30),
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
    themeColor: settings?.themeColor || "#0A2540",
    welcomeMessage: settings?.welcomeMessage || "",
    leftBgColor: settings?.leftBgColor || "#071D33",
    leftTextColor: settings?.leftTextColor || "#FFFFFF",
    leftAccentColor: settings?.leftAccentColor || "#F59E0B",
    telegramEnabled: tenant.telegramEnabled,
    telegramChatId: tenant.telegramChatId,
  };

  return reply.send(responsePayload);
};

/**
 * Protected endpoint to fetch portal settings by tenantId (includes overrides)
 */
export const getPortalSettingsAdmin = async (
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
    themeColor: settings?.themeColor || "#0A2540",
    welcomeMessage: settings?.welcomeMessage || "",
    leftBgColor: settings?.leftBgColor || "#071D33",
    leftTextColor: settings?.leftTextColor || "#FFFFFF",
    leftAccentColor: settings?.leftAccentColor || "#F59E0B",
    telegramEnabled: tenant.telegramEnabled,
    telegramChatId: tenant.telegramChatId,
    googleClientIdOverride: settings?.googleClientIdOverride || "",
    googleClientSecretOverride: settings?.googleClientSecretOverride || "",
    lineChannelIdOverride: settings?.lineChannelIdOverride || "",
    lineChannelSecretOverride: settings?.lineChannelSecretOverride || "",
    trashRetentionDays: tenant.trashRetentionDays ?? 30,
  };

  return reply.send(responsePayload);
};

/**
 * Protected endpoint to update portal settings
 */
export const updatePortalSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;
  const body = request.body as z.infer<typeof updateSettingsSchema>;
  const tenantId = user.tenantId || body.tenantId || null;

  if (!tenantId) {
    return reply.code(400).send({ error: "Tenant context is required. Super Admin must provide a tenantId." });
  }

  // 1. Separate Tenant fields to update tenants table
  const { telegramEnabled, telegramChatId, trashRetentionDays, ...portalData } = body;

  await db.update(tenants).set({
    telegramEnabled: telegramEnabled ?? false,
    telegramChatId: telegramChatId || null,
    trashRetentionDays: trashRetentionDays ?? 30,
    updatedAt: new Date()
  }).where(eq(tenants.id, tenantId));

  // 2. Update portal settings table
  const existing = await db.query.tenantPortalSettings.findFirst({
    where: eq(tenantPortalSettings.tenantId, tenantId),
  });

  if (existing) {
    const [updated] = await db.update(tenantPortalSettings).set({
      ...portalData,
      updatedAt: new Date(),
    }).where(eq(tenantPortalSettings.tenantId, tenantId)).returning();
    return reply.send({ ...updated, telegramEnabled, telegramChatId, trashRetentionDays });
  } else {
    const [inserted] = await db.insert(tenantPortalSettings).values({
      tenantId,
      ...portalData,
    }).returning();
    return reply.status(201).send({ ...inserted, telegramEnabled, telegramChatId, trashRetentionDays });
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

      // Store additional details in userinfo
      await tx.insert(userinfo).values({
        tenantId,
        username: body.username,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        phone: body.phone || null,
      });

      // Bind to default group if configured
      if (settings && settings.defaultRegisterGroupId) {
        await tx.insert(userOrganizations).values({
          tenantId,
          username: body.username,
          organizationId: settings.defaultRegisterGroupId,
        });
      }
    });

    return reply.code(201).send({ message: "Registration successful" });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: "Internal server error during registration" });
  }
};

/**
 * Send a test Telegram message to check connection
 */
export const testTelegramSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  const { chatId } = request.body as { chatId: string };
  if (!chatId) {
    return reply.code(400).send({ error: "Chat ID is required" });
  }

  try {
    const { TelegramService } = await import("../services/telegram.service");
    const telegramService = TelegramService.getInstance();
    
    // Auto-init bot if token is present but bot is not initialized
    if (!telegramService.isInitialized) {
      const globalSet = await db.query.globalSettings.findFirst();
      if (globalSet && globalSet.telegramToken) {
        await telegramService.initBot(globalSet.telegramToken);
      } else {
        return reply.code(400).send({ error: "Telegram Master Bot Token is not configured in Global Settings." });
      }
    }
    
    await telegramService.sendDirectMessage(
      chatId, 
      `🔔 *Test Notification*\nThis is a test message to confirm your Telegram Integration is working correctly!`
    );
    
    return reply.send({ success: true, message: "Test message sent successfully" });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(400).send({ error: error.message || "Failed to send test message" });
  }
};
