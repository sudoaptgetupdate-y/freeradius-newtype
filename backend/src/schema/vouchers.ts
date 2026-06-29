import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const voucherBatches = pgTable("voucher_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  prefix: varchar("prefix", { length: 10 }),
  amount: integer("amount").notNull(),
  groupname: varchar("groupname", { length: 64 }).notNull(), // Profile to bind to
  type: varchar("type", { enum: ["code", "user_pass"] }).notNull().default("code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vouchers = pgTable("vouchers", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").references(() => voucherBatches.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  password: varchar("password", { length: 32 }),
  status: varchar("status", { enum: ["unused", "used", "expired"] }).notNull().default("unused"),
  usedByUsername: varchar("used_by_username", { length: 64 }), // Binds to radcheck username upon use
  createdAt: timestamp("created_at").notNull().defaultNow(),
  usedAt: timestamp("used_at"),
});

export const voucherSettings = pgTable("voucher_settings", {
  tenantId: uuid("tenant_id").primaryKey().references(() => tenants.id).notNull(),
  defaultPrefix: varchar("default_prefix", { length: 10 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  headerText: varchar("header_text", { length: 100 }),
  ssidName: varchar("ssid_name", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
