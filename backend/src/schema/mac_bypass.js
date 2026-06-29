import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
export const macBypass = pgTable("mac_bypass", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
    macAddress: varchar("mac_address", { length: 17 }).notNull(), // e.g., 00:11:22:33:44:55
    vlanId: varchar("vlan_id", { length: 10 }),
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
});
//# sourceMappingURL=mac_bypass.js.map