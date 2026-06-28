"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.radacct = exports.radgroupreply = exports.radgroupcheck = exports.radusergroup = exports.radreply = exports.radcheck = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const tenants_1 = require("./tenants");
// radcheck
exports.radcheck = (0, pg_core_1.pgTable)("radcheck", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id).notNull(),
    username: (0, pg_core_1.varchar)("username", { length: 64 }).notNull(),
    attribute: (0, pg_core_1.varchar)("attribute", { length: 64 }).notNull(),
    op: (0, pg_core_1.varchar)("op", { length: 2 }).notNull().default("=="),
    value: (0, pg_core_1.varchar)("value", { length: 253 }).notNull(),
}, (table) => {
    return {
        uniqueIdx: (0, pg_core_1.uniqueIndex)("radcheck_unique_idx").on(table.tenantId, table.username, table.attribute),
    };
});
// radreply
exports.radreply = (0, pg_core_1.pgTable)("radreply", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id).notNull(),
    username: (0, pg_core_1.varchar)("username", { length: 64 }).notNull(),
    attribute: (0, pg_core_1.varchar)("attribute", { length: 64 }).notNull(),
    op: (0, pg_core_1.varchar)("op", { length: 2 }).notNull().default("="),
    value: (0, pg_core_1.varchar)("value", { length: 253 }).notNull(),
});
// radusergroup
exports.radusergroup = (0, pg_core_1.pgTable)("radusergroup", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id).notNull(),
    username: (0, pg_core_1.varchar)("username", { length: 64 }).notNull(),
    groupname: (0, pg_core_1.varchar)("groupname", { length: 64 }).notNull(),
    priority: (0, pg_core_1.integer)("priority").notNull().default(1),
}, (table) => {
    return {
        uniqueIdx: (0, pg_core_1.uniqueIndex)("radusergroup_unique_idx").on(table.tenantId, table.username),
    };
});
// radgroupcheck
exports.radgroupcheck = (0, pg_core_1.pgTable)("radgroupcheck", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id).notNull(),
    groupname: (0, pg_core_1.varchar)("groupname", { length: 64 }).notNull(),
    attribute: (0, pg_core_1.varchar)("attribute", { length: 64 }).notNull(),
    op: (0, pg_core_1.varchar)("op", { length: 2 }).notNull().default("=="),
    value: (0, pg_core_1.varchar)("value", { length: 253 }).notNull(),
});
// radgroupreply
exports.radgroupreply = (0, pg_core_1.pgTable)("radgroupreply", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id).notNull(),
    groupname: (0, pg_core_1.varchar)("groupname", { length: 64 }).notNull(),
    attribute: (0, pg_core_1.varchar)("attribute", { length: 64 }).notNull(),
    op: (0, pg_core_1.varchar)("op", { length: 2 }).notNull().default("="),
    value: (0, pg_core_1.varchar)("value", { length: 253 }).notNull(),
});
// radacct
exports.radacct = (0, pg_core_1.pgTable)("radacct", {
    radacctid: (0, pg_core_1.bigserial)("radacctid", { mode: "number" }).primaryKey(),
    tenantId: (0, pg_core_1.uuid)("tenant_id").references(() => tenants_1.tenants.id).notNull(),
    acctsessionid: (0, pg_core_1.varchar)("acctsessionid", { length: 64 }).notNull(),
    acctuniqueid: (0, pg_core_1.varchar)("acctuniqueid", { length: 32 }).notNull(),
    username: (0, pg_core_1.varchar)("username", { length: 64 }).notNull(),
    realm: (0, pg_core_1.varchar)("realm", { length: 64 }),
    nasipaddress: (0, pg_core_1.varchar)("nasipaddress", { length: 15 }).notNull(),
    nasportid: (0, pg_core_1.varchar)("nasportid", { length: 32 }),
    nasporttype: (0, pg_core_1.varchar)("nasporttype", { length: 32 }),
    acctstarttime: (0, pg_core_1.timestamp)("acctstarttime"),
    acctupdatetime: (0, pg_core_1.timestamp)("acctupdatetime"),
    acctstoptime: (0, pg_core_1.timestamp)("acctstoptime"),
    acctinterval: (0, pg_core_1.integer)("acctinterval"),
    acctsessiontime: (0, pg_core_1.integer)("acctsessiontime"),
    acctauthentic: (0, pg_core_1.varchar)("acctauthentic", { length: 32 }),
    connectinfo_start: (0, pg_core_1.varchar)("connectinfo_start", { length: 128 }),
    connectinfo_stop: (0, pg_core_1.varchar)("connectinfo_stop", { length: 128 }),
    acctinputoctets: (0, pg_core_1.bigint)("acctinputoctets", { mode: "number" }),
    acctoutputoctets: (0, pg_core_1.bigint)("acctoutputoctets", { mode: "number" }),
    calledstationid: (0, pg_core_1.varchar)("calledstationid", { length: 50 }),
    callingstationid: (0, pg_core_1.varchar)("callingstationid", { length: 50 }),
    acctterminatecause: (0, pg_core_1.varchar)("acctterminatecause", { length: 32 }),
    servicetype: (0, pg_core_1.varchar)("servicetype", { length: 32 }),
    framedprotocol: (0, pg_core_1.varchar)("framedprotocol", { length: 32 }),
    framedipaddress: (0, pg_core_1.varchar)("framedipaddress", { length: 15 }),
});
//# sourceMappingURL=freeradius.js.map