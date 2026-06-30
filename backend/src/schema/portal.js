import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
export const tenantPortalSettings = pgTable("tenant_portal_settings", {
    tenantId: uuid("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
    orgName: varchar("org_name", { length: 255 }).notNull(),
    logoUrl: varchar("logo_url", { length: 500 }),
    termsOfService: text("terms_of_service"),
    footerNote: text("footer_note"),
    isRegisterEnabled: boolean("is_register_enabled").notNull().default(true),
    isSocialLoginEnabled: boolean("is_social_login_enabled").notNull().default(true),
    themeColor: varchar("theme_color", { length: 10 }).notNull().default("#3b82f6"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
//# sourceMappingURL=portal.js.map