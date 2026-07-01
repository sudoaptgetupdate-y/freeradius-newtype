import { db } from "../db";
import { tenants } from "../schema/tenants";
import { radgroupreply, radgroupcheck, radusergroup, radcheck } from "../schema/freeradius";
import { nas } from "../schema/nas";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import { admins } from "../schema/admins";
import { organizations } from "../schema/organizations";
import { tenantPortalSettings } from "../schema/portal";
const tenantSchema = z.object({
    name: z.string().min(1).max(255),
    maxUsers: z.number().min(1).default(100),
    maxNas: z.number().min(1).default(1),
    primaryDeviceType: z.enum(["mikrotik", "fortigate", "standard"]).default("mikrotik"),
    defaultRegisterProfile: z.string().max(255).optional().nullable(),
    status: z.enum(["active", "suspended"]).default("active"),
    allowLogAccess: z.boolean().default(false),
    telegramChatId: z.string().max(100).optional(),
    telegramEnabled: z.boolean().default(false),
    adminEmail: z.string().email().optional(),
    adminPassword: z.string().min(1).optional(),
});
const updateTenantSchema = tenantSchema.partial().extend({
    migrateLegacyUsers: z.boolean().optional(),
});
export const getTenants = async (request, reply) => {
    try {
        const allTenants = await db.select().from(tenants);
        reply.send(allTenants);
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Failed to fetch tenants" });
    }
};
export const createTenant = async (request, reply) => {
    try {
        const data = tenantSchema.parse(request.body);
        // Separate tenant data and admin data
        const { adminEmail, adminPassword, ...tenantData } = data;
        let defaultProfile = tenantData.defaultRegisterProfile;
        if (!defaultProfile || defaultProfile === "none") {
            const suffix = tenantData.primaryDeviceType === "fortigate" ? "FortiGate" : (tenantData.primaryDeviceType === "standard" ? "Standard" : "MikroTik");
            defaultProfile = `Default-${suffix}`;
            tenantData.defaultRegisterProfile = defaultProfile;
        }
        // Use transaction to ensure both are created
        const newTenant = await db.transaction(async (tx) => {
            const [insertedTenant] = await tx.insert(tenants).values(tenantData).returning();
            if (!insertedTenant) {
                throw new Error("Failed to insert tenant");
            }
            // Auto-provision the default profile marker attribute
            await tx.insert(radgroupreply).values({
                tenantId: insertedTenant.id,
                groupname: defaultProfile,
                attribute: "Class",
                op: "=",
                value: defaultProfile,
            });
            // Auto-provision default registration group
            const [defaultGroup] = await tx.insert(organizations).values({
                tenantId: insertedTenant.id,
                name: "Portal Registered Users",
                isSystem: true,
                defaultProfile: defaultProfile,
                description: "Default group for self-registered and social login users (System Protected)",
            }).returning();
            if (!defaultGroup) {
                throw new Error("Failed to auto-provision default registration group");
            }
            // Create tenant portal settings with defaultRegisterGroupId
            await tx.insert(tenantPortalSettings).values({
                tenantId: insertedTenant.id,
                orgName: tenantData.name,
                defaultRegisterGroupId: defaultGroup.id,
            });
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
                    firstName: "Tenant",
                    lastName: "Admin",
                    role: "tenant_admin",
                    tenantId: insertedTenant.id,
                });
            }
            return insertedTenant;
        });
        reply.status(201).send(newTenant);
    }
    catch (error) {
        request.log.error(error);
        if (error instanceof z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.issues });
        }
        if (error.message === "Admin email already exists") {
            return reply.status(409).send({ error: "Admin email already exists" });
        }
        reply.status(500).send({ error: "Failed to create tenant" });
    }
};
export const updateTenant = async (request, reply) => {
    try {
        const { id } = request.params;
        const data = updateTenantSchema.parse(request.body);
        const { migrateLegacyUsers, ...updateData } = data;
        const updatedTenant = await db.transaction(async (tx) => {
            const existingTenant = await tx.select().from(tenants).where(eq(tenants.id, id)).limit(1);
            if (existingTenant.length === 0) {
                throw new Error("Tenant not found");
            }
            const oldDefault = existingTenant[0].defaultRegisterProfile;
            let newDefault = updateData.defaultRegisterProfile ?? oldDefault;
            if (newDefault === "none") {
                newDefault = oldDefault;
                updateData.defaultRegisterProfile = oldDefault;
            }
            const [updated] = await tx
                .update(tenants)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(tenants.id, id))
                .returning();
            if (migrateLegacyUsers && oldDefault && newDefault && oldDefault !== newDefault) {
                await tx
                    .update(radusergroup)
                    .set({ groupname: newDefault })
                    .where(and(eq(radusergroup.tenantId, id), eq(radusergroup.groupname, oldDefault)));
            }
            return updated;
        });
        reply.send(updatedTenant);
    }
    catch (error) {
        request.log.error(error);
        if (error instanceof z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.issues });
        }
        if (error.message === "Tenant not found") {
            return reply.status(404).send({ error: "Tenant not found" });
        }
        reply.status(500).send({ error: "Failed to update tenant" });
    }
};
export const deleteTenant = async (request, reply) => {
    try {
        const { id } = request.params;
        // First find the tenant to get its current status
        const tenant = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
        if (tenant.length === 0) {
            return reply.status(404).send({ error: "Tenant not found" });
        }
        // Check if there are any NAS or Users (radcheck) associated with this tenant
        const nasCount = await db.select().from(nas).where(eq(nas.tenantId, id)).limit(1);
        const userCount = await db.select().from(radcheck).where(eq(radcheck.tenantId, id)).limit(1);
        if (nasCount.length === 0 && userCount.length === 0) {
            // CONDITIONAL HARD DELETE: No usage yet, safe to delete entirely
            await db.transaction(async (tx) => {
                await tx.delete(admins).where(eq(admins.tenantId, id));
                await tx.delete(radgroupreply).where(eq(radgroupreply.tenantId, id));
                await tx.delete(radgroupcheck).where(eq(radgroupcheck.tenantId, id));
                await tx.delete(radusergroup).where(eq(radusergroup.tenantId, id));
                await tx.delete(tenants).where(eq(tenants.id, id));
            });
            return reply.send({ success: true, message: "Tenant deleted permanently" });
        }
        const newStatus = tenant[0].status === "active" ? "suspended" : "active";
        // Toggle status
        const [updatedTenant] = await db
            .update(tenants)
            .set({ status: newStatus, updatedAt: new Date() })
            .where(eq(tenants.id, id))
            .returning();
        reply.send({ success: true, message: `Tenant ${newStatus}` });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: "Failed to delete tenant" });
    }
};
//# sourceMappingURL=tenants.controller.js.map