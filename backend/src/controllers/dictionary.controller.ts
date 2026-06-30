import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { radiusDictionary } from "../schema/freeradius";
import { eq, or, isNull } from "drizzle-orm";
import { z } from "zod";

const dictionarySchema = z.object({
  vendor: z.string().min(1, "Vendor is required"),
  attribute: z.string().min(1, "Attribute name is required"),
  recommendedOp: z.string().min(1, "Operator is required"),
  recommendedType: z.enum(["check", "reply"]),
  description: z.string().optional(),
});

export const getDictionary = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any || {};
    
    // Fetch attributes: global (tenantId is null) + tenant's own
    let attributes;
    if (user.role === "super_admin" || user.role === "admin") {
      attributes = await db.select().from(radiusDictionary);
    } else {
      attributes = await db.select().from(radiusDictionary).where(
        or(
          isNull(radiusDictionary.tenantId),
          eq(radiusDictionary.tenantId, user.tenantId)
        )
      );
    }

    // Sort by vendor, then attribute
    attributes.sort((a, b) => {
      if (a.vendor === b.vendor) {
        return a.attribute.localeCompare(b.attribute);
      }
      return a.vendor.localeCompare(b.vendor);
    });

    reply.send(attributes);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const createDictionaryAttribute = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any || {};
    const data = dictionarySchema.parse(request.body);

    // If super admin, they can create global attributes (tenantId = null)
    const targetTenantId = (user.role === "super_admin" || user.role === "admin") ? null : user.tenantId;

    await db.insert(radiusDictionary).values({
      tenantId: targetTenantId,
      vendor: data.vendor,
      attribute: data.attribute,
      recommendedOp: data.recommendedOp,
      recommendedType: data.recommendedType,
      description: data.description || "",
    });

    reply.status(201).send({ message: "Attribute added to dictionary successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Validation error", details: error.issues });
    }
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const deleteDictionaryAttribute = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any || {};
    const query = request.query as { id?: string };
    
    if (!query.id) {
      return reply.status(400).send({ error: "Attribute ID is required" });
    }

    const attributeId = parseInt(query.id, 10);

    const existing = await db.select().from(radiusDictionary).where(eq(radiusDictionary.id, attributeId)).limit(1);
    const attr = existing[0];
    if (!attr) {
      return reply.status(404).send({ error: "Attribute not found" });
    }

    // Only allow deletion if it belongs to the tenant, or if super admin
    if (attr.tenantId !== user.tenantId && user.role !== "super_admin" && user.role !== "admin") {
      return reply.status(403).send({ error: "Forbidden: Cannot delete global attribute" });
    }

    await db.delete(radiusDictionary).where(eq(radiusDictionary.id, attributeId));

    reply.send({ message: "Attribute deleted successfully" });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
};
