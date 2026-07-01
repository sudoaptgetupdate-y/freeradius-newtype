import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { admins } from "../schema/admins";
import { tenants } from "../schema/tenants";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";

const adminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(), // Optional for update
  role: z.enum(["super_admin", "master_staff", "tenant_admin", "tenant_staff"]),
  tenantId: z.string().uuid().optional().nullable(),
});

export const getAdmins = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    let result;

    if (user.role === "super_admin" || user.role === "admin") {
      result = await db.select({
        id: admins.id,
        email: admins.email,
        role: admins.role,
        tenantId: admins.tenantId,
        createdAt: admins.createdAt,
      }).from(admins).where(isNull(admins.deletedAt));
    } else {
      result = await db.select({
        id: admins.id,
        email: admins.email,
        role: admins.role,
        tenantId: admins.tenantId,
        createdAt: admins.createdAt,
      }).from(admins).where(and(eq(admins.tenantId, user.tenantId), isNull(admins.deletedAt)));
    }

    reply.send(result);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const createAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const data = adminSchema.parse(request.body);

    if (!data.password) {
      return reply.status(400).send({ error: "Password is required for new users" });
    }

    // Authorization checks
    if (user.role !== "super_admin") {
      if (data.role === "super_admin" || data.role === "master_staff") {
        return reply.status(403).send({ error: "Forbidden: Cannot create super admin or master staff" });
      }
      if (data.tenantId !== user.tenantId) {
        return reply.status(403).send({ error: "Forbidden: Cannot create user for another tenant" });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newAdmin = await db.insert(admins).values({
      email: data.email,
      passwordHash,
      role: data.role,
      tenantId: data.tenantId || null,
    }).returning({
      id: admins.id,
      email: admins.email,
      role: admins.role,
      tenantId: admins.tenantId,
    });

    reply.status(201).send(newAdmin![0]);
  } catch (error: any) {
    if (error.code === '23505') { // Postgres unique violation (email)
      return reply.status(400).send({ error: "Email already exists" });
    }
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const updateAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { id } = request.params as { id: string };
    const data = adminSchema.parse(request.body);

    const targetAdmin = await db.select().from(admins).where(and(eq(admins.id, id), isNull(admins.deletedAt))).limit(1);
    
    if (targetAdmin.length === 0) {
      return reply.status(404).send({ error: "Admin not found" });
    }

    // Auth checks
    if (user.role !== "super_admin") {
      if (targetAdmin[0]!.tenantId !== user.tenantId || data.tenantId !== user.tenantId) {
        return reply.status(403).send({ error: "Forbidden" });
      }
      if (data.role === "super_admin" || data.role === "master_staff") {
         return reply.status(403).send({ error: "Forbidden: Cannot grant super admin role" });
      }
    }

    const updateData: any = {
      email: data.email,
      role: data.role,
      tenantId: data.tenantId || null,
      updatedAt: new Date(),
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updatedAdmin = await db.update(admins)
      .set(updateData)
      .where(eq(admins.id, id))
      .returning({
        id: admins.id,
        email: admins.email,
        role: admins.role,
        tenantId: admins.tenantId,
      });

    reply.send(updatedAdmin![0]);
  } catch (error: any) {
    if (error.code === '23505') { 
      return reply.status(400).send({ error: "Email already exists" });
    }
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const deleteAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { id } = request.params as { id: string };

    const targetAdmin = await db.select().from(admins).where(and(eq(admins.id, id), isNull(admins.deletedAt))).limit(1);
    
    if (targetAdmin.length === 0) {
      return reply.status(404).send({ error: "Admin not found" });
    }

    // Check permissions
    if (user.role !== "super_admin" && targetAdmin[0]!.tenantId !== user.tenantId) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    // Prevent deleting oneself
    if (id === user.id) {
      return reply.status(400).send({ error: "Cannot delete your own account" });
    }

    await db.update(admins).set({ deletedAt: new Date() }).where(eq(admins.id, id));

    reply.send({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};
