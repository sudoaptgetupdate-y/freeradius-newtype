import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";
export const globalSettings = pgTable("global_settings", {
    id: uuid("id").primaryKey().defaultRandom(),
    // Telegram Bot Config
    telegramToken: text("telegram_token"),
    telegramBotId: text("telegram_bot_id"),
    telegramChatId: text("telegram_chat_id"),
    telegramEnabled: boolean("telegram_enabled").default(false),
    // Redis Integration Config
    redisHost: text("redis_host"),
    redisPort: integer("redis_port"),
    redisPassword: text("redis_password"),
    // Loki & Vector Config
    lokiUrl: text("loki_url"),
    vectorPort: integer("vector_port"),
    // SMTP Config
    smtpHost: text("smtp_host"),
    smtpPort: integer("smtp_port"),
    smtpUser: text("smtp_user"),
    smtpPassword: text("smtp_password"),
    smtpSender: text("smtp_sender"),
    // General Config
    timezone: text("timezone").default("Asia/Bangkok"),
    // Social Login Config (Global Fallbacks)
    googleClientId: text("google_client_id"),
    googleClientSecret: text("google_client_secret"),
    lineChannelId: text("line_channel_id"),
    lineChannelSecret: text("line_channel_secret"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
//# sourceMappingURL=settings.js.map