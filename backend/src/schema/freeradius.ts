import { pgTable, serial, bigserial, bigint, varchar, integer, uuid, uniqueIndex, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

// radcheck
export const radcheck = pgTable("radcheck", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  username: varchar("username", { length: 64 }).notNull(),
  attribute: varchar("attribute", { length: 64 }).notNull(),
  op: varchar("op", { length: 2 }).notNull().default("=="),
  value: varchar("value", { length: 253 }).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => {
  return {
    uniqueIdx: uniqueIndex("radcheck_unique_idx").on(table.tenantId, table.username, table.attribute),
  };
});

// radreply
export const radreply = pgTable("radreply", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  username: varchar("username", { length: 64 }).notNull(),
  attribute: varchar("attribute", { length: 64 }).notNull(),
  op: varchar("op", { length: 2 }).notNull().default("="),
  value: varchar("value", { length: 253 }).notNull(),
});

// radusergroup
export const radusergroup = pgTable("radusergroup", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  username: varchar("username", { length: 64 }).notNull(),
  groupname: varchar("groupname", { length: 64 }).notNull(),
  priority: integer("priority").notNull().default(1),
}, (table) => {
  return {
    uniqueIdx: uniqueIndex("radusergroup_unique_idx").on(table.tenantId, table.username),
  };
});

// radgroupcheck
export const radgroupcheck = pgTable("radgroupcheck", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  groupname: varchar("groupname", { length: 64 }).notNull(),
  attribute: varchar("attribute", { length: 64 }).notNull(),
  op: varchar("op", { length: 2 }).notNull().default("=="),
  value: varchar("value", { length: 253 }).notNull(),
});

// radgroupreply
export const radgroupreply = pgTable("radgroupreply", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  groupname: varchar("groupname", { length: 64 }).notNull(),
  attribute: varchar("attribute", { length: 64 }).notNull(),
  op: varchar("op", { length: 2 }).notNull().default("="),
  value: varchar("value", { length: 253 }).notNull(),
});

// radacct
export const radacct = pgTable("radacct", {
  radacctid: bigserial("radacctid", { mode: "number" }).primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  acctsessionid: varchar("acctsessionid", { length: 64 }).notNull(),
  acctuniqueid: varchar("acctuniqueid", { length: 32 }).notNull().unique(),
  username: varchar("username", { length: 64 }).notNull(),
  realm: varchar("realm", { length: 64 }),
  nasipaddress: varchar("nasipaddress", { length: 15 }).notNull(),
  nasportid: varchar("nasportid", { length: 32 }),
  nasporttype: varchar("nasporttype", { length: 32 }),
  acctstarttime: timestamp("acctstarttime"),
  acctupdatetime: timestamp("acctupdatetime"),
  acctstoptime: timestamp("acctstoptime"),
  acctinterval: integer("acctinterval"),
  acctsessiontime: integer("acctsessiontime"),
  acctauthentic: varchar("acctauthentic", { length: 32 }),
  connectinfo_start: varchar("connectinfo_start", { length: 128 }),
  connectinfo_stop: varchar("connectinfo_stop", { length: 128 }),
  acctinputoctets: bigint("acctinputoctets", { mode: "number" }),
  acctoutputoctets: bigint("acctoutputoctets", { mode: "number" }),
  calledstationid: varchar("calledstationid", { length: 50 }),
  callingstationid: varchar("callingstationid", { length: 50 }),
  acctterminatecause: varchar("acctterminatecause", { length: 32 }),
  servicetype: varchar("servicetype", { length: 32 }),
  framedprotocol: varchar("framedprotocol", { length: 32 }),
  framedipaddress: varchar("framedipaddress", { length: 15 }),
  framedipv6address: varchar("framedipv6address", { length: 45 }),
  framedipv6prefix: varchar("framedipv6prefix", { length: 45 }),
  framedinterfaceid: varchar("framedinterfaceid", { length: 44 }),
  delegatedipv6prefix: varchar("delegatedipv6prefix", { length: 45 }),
});

// radpostauth
export const radpostauth = pgTable("radpostauth", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  username: varchar("username", { length: 64 }).notNull(),
  pass: varchar("pass", { length: 64 }),
  reply: varchar("reply", { length: 32 }),
  authdate: timestamp("authdate").notNull().defaultNow(),
});
