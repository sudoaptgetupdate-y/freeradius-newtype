import { db } from "../db";
import { globalSettings } from "../schema/settings";
import { z } from "zod";
import { eq } from "drizzle-orm";
const emptyToNull = z.preprocess((val) => (val === "" ? null : val), z.string().optional().nullable());
const emptyToNullUrl = z.preprocess((val) => (val === "" ? null : val), z.string().url().optional().nullable());
const emptyToNullEmail = z.preprocess((val) => (val === "" ? null : val), z.string().email().optional().nullable());
const emptyToNullNumber = z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().optional().nullable());
export const settingsSchema = z.object({
    telegramToken: emptyToNull,
    telegramBotId: emptyToNull,
    telegramChatId: emptyToNull,
    telegramEnabled: z.boolean().default(false),
    redisHost: emptyToNull,
    redisPort: emptyToNullNumber,
    redisPassword: emptyToNull,
    lokiUrl: emptyToNullUrl,
    vectorPort: emptyToNullNumber,
    smtpHost: emptyToNull,
    smtpPort: emptyToNullNumber,
    smtpUser: emptyToNull,
    smtpPassword: emptyToNull,
    smtpSender: emptyToNullEmail,
    timezone: z.string().default("Asia/Bangkok"),
});
export const getSettings = async (request, reply) => {
    const user = request.user;
    if (user.role !== "super_admin" && user.role !== "admin") {
        return reply.code(403).send({ error: "Forbidden: Only Master Admin can access global settings" });
    }
    const settings = await db.query.globalSettings.findFirst();
    if (!settings) {
        return reply.send({}); // return empty object if no settings found
    }
    return reply.send(settings);
};
export const updateSettings = async (request, reply) => {
    const user = request.user;
    if (user.role !== "super_admin" && user.role !== "admin") {
        return reply.code(403).send({ error: "Forbidden: Only Master Admin can update global settings" });
    }
    const body = request.body;
    // Check if a row exists
    const existing = await db.query.globalSettings.findFirst();
    let result;
    if (existing) {
        // Update existing row
        [result] = await db.update(globalSettings)
            .set({
            ...body,
            updatedAt: new Date()
        })
            .where(eq(globalSettings.id, existing.id))
            .returning();
    }
    else {
        // Insert new row
        [result] = await db.insert(globalSettings)
            .values({
            ...body,
        })
            .returning();
    }
    return reply.send(result);
};
//# sourceMappingURL=settings.controller.js.map