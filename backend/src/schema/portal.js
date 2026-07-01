import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { organizations } from "./organizations";
export const tenantPortalSettings = pgTable("tenant_portal_settings", {
    tenantId: uuid("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
    orgName: varchar("org_name", { length: 255 }).notNull(),
    logoUrl: varchar("logo_url", { length: 500 }),
    termsOfService: text("terms_of_service"),
    footerNote: text("footer_note"),
    isRegisterEnabled: boolean("is_register_enabled").notNull().default(true),
    isSocialLoginEnabled: boolean("is_social_login_enabled").notNull().default(true),
    defaultRegisterGroupId: uuid("default_register_group_id").references(() => organizations.id),
    themeColor: varchar("theme_color", { length: 10 }).notNull().default("#0A2540"),
    welcomeMessage: text("welcome_message"),
    leftBgColor: varchar("left_bg_color", { length: 10 }).notNull().default("#071D33"),
    leftTextColor: varchar("left_text_color", { length: 10 }).notNull().default("#FFFFFF"),
    leftAccentColor: varchar("left_accent_color", { length: 10 }).notNull().default("#F59E0B"),
    // Social Login Overrides (Tenant-Specific)
    googleClientIdOverride: text("google_client_id_override"),
    googleClientSecretOverride: text("google_client_secret_override"),
    lineChannelIdOverride: text("line_channel_id_override"),
    lineChannelSecretOverride: text("line_channel_secret_override"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
//# sourceMappingURL=portal.js.map