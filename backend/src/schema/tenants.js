"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenants = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.tenants = (0, pg_core_1.pgTable)("tenants", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    maxUsers: (0, pg_core_1.integer)("max_users").notNull().default(100),
    maxNas: (0, pg_core_1.integer)("max_nas").notNull().default(1),
    status: (0, pg_core_1.varchar)("status", { enum: ["active", "suspended"] }).notNull().default("active"),
    allowLogAccess: (0, pg_core_1.boolean)("allow_log_access").notNull().default(false),
    telegramChatId: (0, pg_core_1.varchar)("telegram_chat_id", { length: 100 }),
    telegramEnabled: (0, pg_core_1.boolean)("telegram_enabled").notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
//# sourceMappingURL=tenants.js.map