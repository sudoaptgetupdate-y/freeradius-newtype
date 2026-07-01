import { pgTable, uuid, varchar, timestamp, serial, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
export const organizations = pgTable("organizations", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    defaultProfile: varchar("default_profile", { length: 64 }), // mapped to groupname
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
});
export const userOrganizations = pgTable("user_organizations", {
    id: serial("id").primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
    username: varchar("username", { length: 64 }).notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
    return {
        uniqueIdx: uniqueIndex("user_org_unique_idx").on(table.tenantId, table.username),
    };
});
//# sourceMappingURL=organizations.js.map