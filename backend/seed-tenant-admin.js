"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./src/db");
const admins_1 = require("./src/schema/admins");
const tenants_1 = require("./src/schema/tenants");
const bcrypt_1 = __importDefault(require("bcrypt"));
const drizzle_orm_1 = require("drizzle-orm");
const seed = async () => { const t = await db_1.db.select().from(tenants_1.tenants).limit(1); if (!t[0])
    return; const existing = await db_1.db.select().from(admins_1.admins).where((0, drizzle_orm_1.eq)(admins_1.admins.email, 'tenant@saas.local')); if (existing.length === 0) {
    const passwordHash = await bcrypt_1.default.hash('password123', 10);
    await db_1.db.insert(admins_1.admins).values({ email: 'tenant@saas.local', passwordHash, role: 'admin', tenantId: t[0].id });
    console.log('Tenant admin created!');
}
else {
    console.log('Tenant admin already exists.');
} process.exit(0); };
seed().catch(e => console.error(e));
//# sourceMappingURL=seed-tenant-admin.js.map