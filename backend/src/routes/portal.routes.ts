import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  getPortalSettings,
  updatePortalSettings,
  registerUser,
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
  server.put("/settings", {
    preHandler: [fastify.requireTenantAdmin],
    schema: {
      body: updateSettingsSchema,
      tags: ["Portal"],
      description: "Update portal settings (requires tenant_admin)",
    },
  }, updatePortalSettings);
}
