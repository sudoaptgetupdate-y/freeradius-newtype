"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
const admins_1 = require("../src/schema/admins");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seed = async () => {
    console.log("Seeding Super Admin...");
    const email = "admin@saas.local";
    const password = "password123";
    // Check if exists
    const existing = await db_1.db.select().from(admins_1.admins).where((0, drizzle_orm_1.eq)(admins_1.admins.email, email));
    if (existing.length > 0) {
        console.log("Super admin already exists!");
        process.exit(0);
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    await db_1.db.insert(admins_1.admins).values({
        email,
        passwordHash,
        role: "super_admin",
    });
    console.log(`Super admin created!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
};
seed().catch((err) => {
    console.error("Error seeding database:", err);
    process.exit(1);
});
//# sourceMappingURL=seed-super-admin.js.map