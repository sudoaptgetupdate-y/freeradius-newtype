import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  maxUsers: integer("max_users").notNull().default(100),
  maxNas: integer("max_nas").notNull().default(1),
  status: varchar("status", { enum: ["active", "suspended"] }).notNull().default("active"),
  allowLogAccess: boolean("allow_log_access").notNull().default(false),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }),
  telegramEnabled: boolean("telegram_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
