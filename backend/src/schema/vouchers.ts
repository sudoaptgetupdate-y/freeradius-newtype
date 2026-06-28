import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const voucherBatches = pgTable("voucher_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  prefix: varchar("prefix", { length: 10 }),
  amount: integer("amount").notNull(),
  groupname: varchar("groupname", { length: 64 }).notNull(), // Profile to bind to
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vouchers = pgTable("vouchers", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").references(() => voucherBatches.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  status: varchar("status", { enum: ["unused", "used", "expired"] }).notNull().default("unused"),
  usedByUsername: varchar("used_by_username", { length: 64 }), // Binds to radcheck username upon use
  createdAt: timestamp("created_at").notNull().defaultNow(),
  usedAt: timestamp("used_at"),
});
