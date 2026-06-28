"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admins = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const tenants_1 = require("./tenants");
exports.admins = (0, pg_core_1.pgTable)("admins", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id), // Nullable for Super Admin
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.varchar)("password_hash", { length: 255 }).notNull(),
    role: (0, pg_core_1.varchar)("role", { enum: ["super_admin", "tenant_admin", "tenant_staff"] }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
//# sourceMappingURL=admins.js.map