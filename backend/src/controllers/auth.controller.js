import { authService } from "../services/auth.service";
import { db } from "../db";
import { admins } from "../schema/admins";
import { tenants } from "../schema/tenants";
import { eq } from "drizzle-orm";
import { z } from "zod";
export const login = async (request, reply) => {
    try {
        const input = request.body;
        const user = await authService.login(input);
        // Record Last Login Time and IP
        await db.update(admins)
            .set({
            lastLoginAt: new Date(),
            lastLoginIp: request.ip
        })
            .where(eq(admins.id, user.id));
        // Generate JWT
        const token = await reply.jwtSign(user);
        // Set HttpOnly Cookie (Security Best Practice)
        reply.setCookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        return reply.send({
            message: "Login successful",
            token,
            user,
        });
    }
    catch (error) {
        if (error.message === "Invalid email or password") {
            return reply.code(401).send({ error: "Unauthorized", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
const impersonateSchema = z.object({
    tenantId: z.string().uuid(),
});
export const impersonate = async (request, reply) => {
    try {
        const caller = request.user;
        const { tenantId } = impersonateSchema.parse(request.body);
        // Verify target tenant exists and is active
        const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
        if (!tenant) {
            return reply.code(404).send({ error: "Not Found", message: "Tenant not found" });
        }
        if (tenant.status === "suspended") {
            return reply.code(400).send({ error: "Bad Request", message: "Cannot impersonate a suspended tenant" });
        }
        // Build impersonation JWT payload
        const impersonatedPayload = {
            id: caller.id,
            email: caller.email,
            role: caller.role, // Stays 'super_admin' for audit purposes
            tenantId: tenantId, // Scoped to this tenant
            isImpersonating: true,
            originalAdminId: caller.id,
            primaryDeviceType: tenant.primaryDeviceType,
            defaultRegisterProfile: tenant.defaultRegisterProfile,
        };
        // Issue a short-lived impersonation token (2 hours)
        const impersonationToken = await reply.jwtSign(impersonatedPayload, { expiresIn: "2h" });
        reply.setCookie("token", impersonationToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
            maxAge: 2 * 60 * 60, // 2 hours
        });
        return reply.send({
            message: `Impersonating tenant: ${tenant.name}`,
            token: impersonationToken,
            tenantName: tenant.name,
            user: impersonatedPayload,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return reply.code(400).send({ error: "Bad Request", message: error.issues });
        }
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
export const exitImpersonate = async (request, reply) => {
    try {
        const currentUser = request.user;
        if (!currentUser.isImpersonating) {
            return reply.code(400).send({ error: "Bad Request", message: "Not in impersonation mode" });
        }
        // Fetch original admin's full data to re-issue a proper master token
        const [admin] = await db.select().from(admins).where(eq(admins.id, currentUser.originalAdminId)).limit(1);
        if (!admin) {
            return reply.code(404).send({ error: "Not Found", message: "Original admin account not found" });
        }
        const masterPayload = {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            tenantId: admin.tenantId, // null for super_admin
        };
        const masterToken = await reply.jwtSign(masterPayload, { expiresIn: "7d" });
        reply.setCookie("token", masterToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        return reply.send({
            message: "Exited impersonation mode",
            token: masterToken,
            user: masterPayload,
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
//# sourceMappingURL=auth.controller.js.map