"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nas = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const tenants_1 = require("./tenants");
exports.nas = (0, pg_core_1.pgTable)("nas", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id).notNull(),
    nasname: (0, pg_core_1.varchar)("nasname", { length: 128 }).notNull(), // IP Address
    shortname: (0, pg_core_1.varchar)("shortname", { length: 32 }).notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 30 }).notNull().default("other"), // mikrotik, fortigate, other
    secret: (0, pg_core_1.varchar)("secret", { length: 60 }).notNull(),
    apiUsername: (0, pg_core_1.varchar)("api_username", { length: 255 }),
    apiPasswordEncrypted: (0, pg_core_1.varchar)("api_password_encrypted", { length: 512 }),
    description: (0, pg_core_1.varchar)("description", { length: 200 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
//# sourceMappingURL=nas.js.map