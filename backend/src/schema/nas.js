import { pgTable, serial, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
export const nas = pgTable("nas", {
    id: serial("id").primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
    nasname: varchar("nasname", { length: 128 }).notNull().unique(), // IP Address
    shortname: varchar("shortname", { length: 32 }).notNull(),
    type: varchar("type", { length: 30 }).notNull().default("other"), // mikrotik, fortigate, other
    secret: varchar("secret", { length: 60 }).notNull(),
    apiUsername: varchar("api_username", { length: 255 }),
    apiPasswordEncrypted: varchar("api_password_encrypted", { length: 512 }),
    description: varchar("description", { length: 200 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
});
//# sourceMappingURL=nas.js.map