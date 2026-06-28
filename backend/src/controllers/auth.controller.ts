import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { admins } from "../schema/admins";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = loginSchema.parse(request.body);

    const adminList = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    
    if (adminList.length === 0) {
      return reply.code(401).send({ error: "Unauthorized", message: "Invalid email or password" });
    }

    const admin = adminList[0];
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      return reply.code(401).send({ error: "Unauthorized", message: "Invalid email or password" });
    }

    // Generate JWT
    const token = await reply.jwtSign({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      tenantId: admin.tenantId,
    });

    return reply.send({
      message: "Login successful",
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        tenantId: admin.tenantId,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: "Bad Request", message: error.errors });
    }
    request.log.error(error);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
};
