import { pgTable, serial, varchar, uuid, uniqueIndex, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const userinfo = pgTable("userinfo", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  username: varchar("username", { length: 64 }).notNull(),
  firstName: varchar("first_name", { length: 200 }),
  lastName: varchar("last_name", { length: 200 }),
  memberId: varchar("member_id", { length: 100 }),
  citizenId: varchar("citizen_id", { length: 100 }),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueIdx: uniqueIndex("userinfo_unique_idx").on(table.tenantId, table.username),
  };
});
