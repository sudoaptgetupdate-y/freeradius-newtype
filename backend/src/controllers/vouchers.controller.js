import { voucherQueue, redisConnection } from "../lib/queue";
import { db } from "../db";
import { voucherBatches, vouchers, voucherSettings } from "../schema/vouchers";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
export const generateVouchersSchema = z.object({
    amount: z.number().min(1).max(1000),
    groupname: z.string().min(1),
    prefix: z.string().max(10).optional(),
    tenantId: z.string().uuid().optional(),
    type: z.enum(["code", "user_pass"]).optional().default("code"),
    codeLength: z.number().min(4).max(16).optional().default(6),
    passwordLength: z.number().min(4).max(16).optional().default(6),
});
export const generateVouchers = async (request, reply) => {
    const user = request.user;
    const body = request.body;
    const tenantId = user.tenantId || body.tenantId || null;
    if (!tenantId) {
        return reply.code(400).send({ error: "Tenant context is required. Super Admin must provide a tenantId." });
    }
    if (redisConnection.status !== "ready") {
        return reply.code(503).send({ error: "Redis is not connected. Please start your Redis server." });
    }
    const job = await voucherQueue.add("generate_vouchers", {
        tenantId,
        amount: body.amount,
        groupname: body.groupname,
        prefix: body.prefix,
        type: body.type,
        codeLength: body.codeLength,
        passwordLength: body.passwordLength,
    });
    return reply.code(202).send({ message: "Voucher generation started", jobId: job.id });
};
export const getJobStatus = async (request, reply) => {
    const { id } = request.params;
    const job = await voucherQueue.getJob(id);
    if (!job) {
        return reply.code(404).send({ error: "Job not found" });
    }
    const state = await job.getState();
    const progress = job.progress;
    return reply.send({ id: job.id, state, progress, returnvalue: job.returnvalue });
};
export const getVoucherBatches = async (request, reply) => {
    const user = request.user;
    const tenantId = user.tenantId ?? null;
    const batches = await db.query.voucherBatches.findMany({
        where: tenantId ? eq(voucherBatches.tenantId, tenantId) : undefined,
        orderBy: [desc(voucherBatches.createdAt)],
    });
    return reply.send(batches);
};
export const getVouchers = async (request, reply) => {
    const { batchId } = request.query;
    if (!batchId) {
        return reply.code(400).send({ error: "batchId is required" });
    }
    const data = await db.query.vouchers.findMany({
        where: eq(vouchers.batchId, batchId),
        orderBy: [desc(vouchers.createdAt)],
    });
    return reply.send(data);
};
export const getVoucherSettings = async (request, reply) => {
    const user = request.user;
    const tenantId = user.tenantId || request.query.tenantId || null;
    if (!tenantId) {
        return reply.code(400).send({ error: "Tenant ID is required" });
    }
    let settings = await db.query.voucherSettings.findFirst({
        where: eq(voucherSettings.tenantId, tenantId),
    });
    if (!settings) {
        // Return empty state or insert default
        settings = {
            tenantId,
            defaultPrefix: null,
            logoUrl: null,
            headerText: null,
            ssidName: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    return reply.send(settings);
};
export const updateVoucherSettingsSchema = z.object({
    tenantId: z.string().uuid().optional(),
    defaultPrefix: z.preprocess((val) => val === "" ? null : val, z.string().max(10).nullable().optional()),
    logoUrl: z.preprocess((val) => val === "" ? null : val, z.string().max(500).nullable().optional()),
    headerText: z.preprocess((val) => val === "" ? null : val, z.string().max(100).nullable().optional()),
    ssidName: z.preprocess((val) => val === "" ? null : val, z.string().max(100).nullable().optional()),
});
export const updateVoucherSettings = async (request, reply) => {
    const user = request.user;
    const body = request.body;
    const tenantId = user.tenantId || body.tenantId || null;
    if (!tenantId) {
        return reply.code(400).send({ error: "Tenant context is required. Super Admin must provide a tenantId." });
    }
    const [settings] = await db.insert(voucherSettings).values({
        tenantId,
        defaultPrefix: body.defaultPrefix ?? null,
        logoUrl: body.logoUrl ?? null,
        headerText: body.headerText ?? null,
        ssidName: body.ssidName ?? null,
        updatedAt: new Date(),
    }).onConflictDoUpdate({
        target: voucherSettings.tenantId,
        set: {
            defaultPrefix: body.defaultPrefix ?? null,
            logoUrl: body.logoUrl ?? null,
            headerText: body.headerText ?? null,
            ssidName: body.ssidName ?? null,
            updatedAt: new Date(),
        }
    }).returning();
    return reply.send(settings);
};
//# sourceMappingURL=vouchers.controller.js.map