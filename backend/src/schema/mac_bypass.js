"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.macBypass = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const tenants_1 = require("./tenants");
exports.macBypass = (0, pg_core_1.pgTable)("mac_bypass", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id).notNull(),
    macAddress: (0, pg_core_1.varchar)("mac_address", { length: 17 }).notNull(), // e.g., 00:11:22:33:44:55
    vlanId: (0, pg_core_1.varchar)("vlan_id", { length: 10 }),
    description: (0, pg_core_1.varchar)("description", { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
//# sourceMappingURL=mac_bypass.js.map