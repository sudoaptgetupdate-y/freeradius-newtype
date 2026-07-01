import type { FastifyRequest, FastifyReply } from "fastify";
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
  googleClientId: emptyToNull,
  googleClientSecret: emptyToNull,
  lineChannelId: emptyToNull,
  lineChannelSecret: emptyToNull,
});

export const getSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;
  if (user.role !== "super_admin" && user.role !== "admin") {
    return reply.code(403).send({ error: "Forbidden: Only Master Admin can access global settings" });
  }

  const settings = await db.query.globalSettings.findFirst();
  
  if (!settings) {
    return reply.send({}); // return empty object if no settings found
  }

  return reply.send(settings);
};

export const updateSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;
  if (user.role !== "super_admin" && user.role !== "admin") {
    return reply.code(403).send({ error: "Forbidden: Only Master Admin can update global settings" });
  }

  const body = request.body as z.infer<typeof settingsSchema>;

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
  } else {
    // Insert new row
    [result] = await db.insert(globalSettings)
      .values({
        ...body,
      })
      .returning();
  }

  return reply.send(result);
};

export const syncTelegramWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;
  if (user.role !== "super_admin" && user.role !== "admin") {
    return reply.code(403).send({ error: "Forbidden: Only Master Admin can sync telegram webhook" });
  }

  const { webhookUrl } = request.body as { webhookUrl: string };
  if (!webhookUrl) return reply.code(400).send({ error: "Webhook URL is required" });

  const settings = await db.query.globalSettings.findFirst();
  if (!settings || !settings.telegramToken) {
    return reply.code(400).send({ error: "Telegram Token is not configured in settings." });
  }

  try {
    const { TelegramService } = await import("../services/telegram.service");
    const telegramService = TelegramService.getInstance();
    await telegramService.initBot(settings.telegramToken);
    
    // node-telegram-bot-api provides bot.setWebHook
    // since we wrapped it, let's expose setWebHook in the service or just fetch directly
    const response = await fetch(`https://api.telegram.org/bot${settings.telegramToken}/setWebhook?url=${webhookUrl}/api/v1/webhooks/telegram/${settings.telegramToken}`);
    
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.description || "Failed to set webhook");
    }

    return reply.send({ message: "Webhook synchronized successfully", details: data });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: error.message || "Failed to synchronize webhook" });
  }
};
