import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { tenants } from "../schema/tenants";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import { admins } from "../schema/admins";

const tenantSchema = z.object({
  name: z.string().min(1).max(255),
  maxUsers: z.number().min(1).default(100),
  maxNas: z.number().min(1).default(1),
  status: z.enum(["active", "suspended"]).default("active"),
  allowLogAccess: z.boolean().default(false),
  telegramChatId: z.string().max(100).optional(),
  telegramEnabled: z.boolean().default(false),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(1).optional(),
});

export const getTenants = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const allTenants = await db.select().from(tenants);
    reply.send(allTenants);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Failed to fetch tenants" });
  }
};

export const createTenant = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = tenantSchema.parse(request.body);
    
    // Separate tenant data and admin data
    const { adminEmail, adminPassword, ...tenantData } = data;

    // Use transaction to ensure both are created
    const newTenant = await db.transaction(async (tx) => {
      const [insertedTenant] = await tx.insert(tenants).values(tenantData).returning();

      if (adminEmail && adminPassword) {
        // Check if admin email already exists
        const existingAdmin = await tx.select().from(admins).where(eq(admins.email, adminEmail)).limit(1);
        if (existingAdmin.length > 0) {
          throw new Error("Admin email already exists");
        }

        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await tx.insert(admins).values({
          email: adminEmail,
          passwordHash,
          role: "tenant_admin",
          tenantId: insertedTenant.id,
        });
      }
      return insertedTenant;
    });

    reply.status(201).send(newTenant);
  } catch (error: any) {
    request.log.error(error);
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Validation error", details: error.errors });
    }
    if (error.message === "Admin email already exists") {
      return reply.status(409).send({ error: "Admin email already exists" });
    }
    reply.status(500).send({ error: "Failed to create tenant" });
  }
};

export const updateTenant = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const data = tenantSchema.partial().parse(request.body);
    const [updatedTenant] = await db
      .update(tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();

    if (!updatedTenant) {
      return reply.status(404).send({ error: "Tenant not found" });
    }
    reply.send(updatedTenant);
  } catch (error: any) {
    request.log.error(error);
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Validation error", details: error.errors });
    }
    reply.status(500).send({ error: "Failed to update tenant" });
  }
};

export const deleteTenant = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    
    // First find the tenant to get its current status
    const tenant = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    if (tenant.length === 0) {
      return reply.status(404).send({ error: "Tenant not found" });
    }

    const newStatus = tenant[0].status === "active" ? "suspended" : "active";

    // Toggle status
    const [updatedTenant] = await db
      .update(tenants)
      .set({ status: newStatus as "active" | "suspended", updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();

    reply.send({ success: true, message: `Tenant ${newStatus}` });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Failed to delete tenant" });
  }
};
