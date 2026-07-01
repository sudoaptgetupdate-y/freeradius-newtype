import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  getPortalSettings,
  getPortalSettingsAdmin,
  updatePortalSettings,
  registerUser,
  testTelegramSettings,
  updateSettingsSchema,
  registerUserSchema,
} from "../controllers/portal.controller";
import { z } from "zod";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // --- Public Routes ---
  server.get("/settings/:tenantId", {
    schema: {
      params: z.object({ tenantId: z.string().uuid() }),
      tags: ["Portal"],
      description: "Get portal settings for a specific tenant",
    },
  }, getPortalSettings);

  server.post("/register/:tenantId", {
    schema: {
      params: z.object({ tenantId: z.string().uuid() }),
      body: registerUserSchema,
      tags: ["Portal"],
      description: "Self-register a new user for the captive portal",
    },
  }, registerUser);

  // --- Protected Routes ---
  server.get("/settings/admin/:tenantId", {
    preHandler: [fastify.requireTenantAdmin],
    schema: {
      params: z.object({ tenantId: z.string().uuid() }),
      tags: ["Portal"],
      description: "Get full portal settings (requires tenant_admin)",
    },
  }, getPortalSettingsAdmin);

  server.put("/settings", {
    preHandler: [fastify.requireTenantAdmin],
    schema: {
      body: updateSettingsSchema,
      tags: ["Portal"],
      description: "Update portal settings (requires tenant_admin)",
    },
  }, updatePortalSettings);

  server.post("/settings/telegram/test", {
    preHandler: [fastify.requireTenantAdmin],
    schema: {
      body: z.object({ chatId: z.string().min(1) }),
      tags: ["Portal"],
      description: "Send test Telegram notification to verify Chat ID",
    },
  }, testTelegramSettings);
}
