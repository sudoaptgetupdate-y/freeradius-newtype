import { db } from "../db";
import { radcheck, radacct, radusergroup, radgroupreply, radgroupcheck } from "../schema/freeradius";
import { nas } from "../schema/nas";
import { tenants } from "../schema/tenants";
import { RadiusCoAService } from "../services/radius-coa.service";
import { eq, and, isNull, desc, sum } from "drizzle-orm";
import { z } from "zod";
const loginSchema = z.object({
    tenantId: z.string().uuid(),
    username: z.string(),
    password: z.string(),
});
export const selfCareLogin = async (request, reply) => {
    try {
        const data = loginSchema.parse(request.body);
        // Check user in radcheck
        const userRecords = await db.select().from(radcheck).where(and(eq(radcheck.tenantId, data.tenantId), eq(radcheck.username, data.username), eq(radcheck.attribute, "Cleartext-Password"), isNull(radcheck.deletedAt)));
        if (userRecords.length === 0 || userRecords[0].value !== data.password) {
            return reply.code(401).send({ error: "Invalid username or password" });
        }
        // Verify tenant
        const tenantRecords = await db.select().from(tenants).where(eq(tenants.id, data.tenantId));
        if (tenantRecords.length === 0 || tenantRecords[0].status !== 'active') {
            return reply.code(401).send({ error: "Tenant is inactive or not found" });
        }
        const payload = {
            id: userRecords[0].id,
            tenantId: data.tenantId,
            username: data.username,
            role: "end_user"
        };
        const token = await reply.jwtSign(payload);
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
            user: payload
        });
    }
    catch (error) {
        request.log.error(error);
        if (error instanceof z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.issues });
        }
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
export const getSelfCareProfile = async (request, reply) => {
    try {
        const user = request.user;
        if (user.role !== "end_user")
            return reply.code(403).send({ error: "Forbidden" });
        // Get group/profile
        const userGroup = await db.select().from(radusergroup).where(and(eq(radusergroup.tenantId, user.tenantId), eq(radusergroup.username, user.username))).limit(1);
        let profileName = "Default";
        let dataLimit = null; // in bytes
        let timeLimit = null; // in seconds
        if (userGroup.length > 0) {
            profileName = userGroup[0].groupname;
            // Fetch limits from radgroupcheck / radgroupreply
            const groupChecks = await db.select().from(radgroupcheck).where(and(eq(radgroupcheck.tenantId, user.tenantId), eq(radgroupcheck.groupname, profileName)));
            const groupReplies = await db.select().from(radgroupreply).where(and(eq(radgroupreply.tenantId, user.tenantId), eq(radgroupreply.groupname, profileName)));
            for (const attr of [...groupChecks, ...groupReplies]) {
                if (attr.attribute === "Max-Total-Octets" || attr.attribute === "Mikrotik-Total-Limit") {
                    dataLimit = parseInt(attr.value, 10);
                }
                if (attr.attribute === "Session-Timeout" || attr.attribute === "Max-All-Session") {
                    timeLimit = parseInt(attr.value, 10);
                }
            }
        }
        // Get total usage from radacct
        const usageQuery = await db.select({
            totalInput: sum(radacct.acctinputoctets),
            totalOutput: sum(radacct.acctoutputoctets),
            totalTime: sum(radacct.acctsessiontime)
        }).from(radacct).where(and(eq(radacct.tenantId, user.tenantId), eq(radacct.username, user.username)));
        const usage = usageQuery[0];
        const downloadBytes = Number(usage.totalOutput || 0);
        const uploadBytes = Number(usage.totalInput || 0);
        const totalBytes = downloadBytes + uploadBytes;
        const totalTime = Number(usage.totalTime || 0);
        return reply.send({
            username: user.username,
            profileName,
            usage: {
                totalBytes,
                totalTime,
                downloadBytes,
                uploadBytes
            },
            limits: {
                dataLimit,
                timeLimit
            }
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
export const getActiveSessions = async (request, reply) => {
    try {
        const user = request.user;
        if (user.role !== "end_user")
            return reply.code(403).send({ error: "Forbidden" });
        const sessions = await db.select().from(radacct).where(and(eq(radacct.tenantId, user.tenantId), eq(radacct.username, user.username), isNull(radacct.acctstoptime))).orderBy(desc(radacct.acctstarttime));
        return reply.send(sessions);
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
export const getSessionHistory = async (request, reply) => {
    try {
        const user = request.user;
        if (user.role !== "end_user")
            return reply.code(403).send({ error: "Forbidden" });
        const sessions = await db.select().from(radacct).where(and(eq(radacct.tenantId, user.tenantId), eq(radacct.username, user.username))).orderBy(desc(radacct.acctstarttime)).limit(50);
        return reply.send(sessions);
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
const disconnectSchema = z.object({
    acctsessionid: z.string(),
    nasipaddress: z.string()
});
export const disconnectSession = async (request, reply) => {
    try {
        const user = request.user;
        if (user.role !== "end_user")
            return reply.code(403).send({ error: "Forbidden" });
        const { acctsessionid, nasipaddress } = disconnectSchema.parse(request.body);
        // Verify session belongs to user
        const sessionRecords = await db.select().from(radacct).where(and(eq(radacct.tenantId, user.tenantId), eq(radacct.username, user.username), eq(radacct.acctsessionid, acctsessionid), isNull(radacct.acctstoptime))).limit(1);
        if (sessionRecords.length === 0) {
            return reply.code(404).send({ error: "Active session not found" });
        }
        // Get NAS secret
        const nasRecords = await db.select().from(nas).where(and(eq(nas.tenantId, user.tenantId), eq(nas.nasname, nasipaddress) // nasname stores IP
        )).limit(1);
        if (nasRecords.length === 0) {
            return reply.code(404).send({ error: "NAS not found" });
        }
        const secret = nasRecords[0].secret;
        // Send CoA disconnect
        const success = await RadiusCoAService.disconnectUser({
            ip: nasipaddress,
            secret
        }, user.username);
        if (success) {
            return reply.send({ success: true, message: "Disconnect command sent successfully" });
        }
        else {
            return reply.code(500).send({ error: "Failed to disconnect session" });
        }
    }
    catch (error) {
        request.log.error(error);
        if (error instanceof z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.issues });
        }
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
const passwordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(4)
});
export const changePassword = async (request, reply) => {
    try {
        const user = request.user;
        if (user.role !== "end_user")
            return reply.code(403).send({ error: "Forbidden" });
        const data = passwordSchema.parse(request.body);
        const userRecords = await db.select().from(radcheck).where(and(eq(radcheck.tenantId, user.tenantId), eq(radcheck.username, user.username), eq(radcheck.attribute, "Cleartext-Password"), isNull(radcheck.deletedAt))).limit(1);
        if (userRecords.length === 0 || userRecords[0].value !== data.currentPassword) {
            return reply.code(401).send({ error: "Invalid current password" });
        }
        await db.update(radcheck).set({
            value: data.newPassword
        }).where(eq(radcheck.id, userRecords[0].id));
        return reply.send({ success: true, message: "Password updated successfully" });
    }
    catch (error) {
        request.log.error(error);
        if (error instanceof z.ZodError) {
            return reply.status(400).send({ error: "Validation error", details: error.issues });
        }
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
//# sourceMappingURL=selfcare.controller.js.map