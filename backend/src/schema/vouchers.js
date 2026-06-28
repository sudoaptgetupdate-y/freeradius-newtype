"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vouchers = exports.voucherBatches = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const tenants_1 = require("./tenants");
exports.voucherBatches = (0, pg_core_1.pgTable)("voucher_batches", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id).notNull(),
    prefix: (0, pg_core_1.varchar)("prefix", { length: 10 }),
    amount: (0, pg_core_1.integer)("amount").notNull(),
    groupname: (0, pg_core_1.varchar)("groupname", { length: 64 }).notNull(), // Profile to bind to
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
exports.vouchers = (0, pg_core_1.pgTable)("vouchers", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    batchId: (0, pg_core_1.uuid)("batch_id").references(() => exports.voucherBatches.id).notNull(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id).notNull(),
    code: (0, pg_core_1.varchar)("code", { length: 32 }).notNull(),
    status: (0, pg_core_1.varchar)("status", { enum: ["unused", "used", "expired"] }).notNull().default("unused"),
    usedByUsername: (0, pg_core_1.varchar)("used_by_username", { length: 64 }), // Binds to radcheck username upon use
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    usedAt: (0, pg_core_1.timestamp)("used_at"),
});
//# sourceMappingURL=vouchers.js.map