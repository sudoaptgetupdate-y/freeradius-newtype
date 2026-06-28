"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("postgres"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sql = (0, postgres_1.default)(process.env.DATABASE_URL);
async function main() {
    console.log("Dropping all tables...");
    const tables = await sql `
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public';
  `;
    for (const table of tables) {
        console.log(`Dropping table ${table.tablename}...`);
        await sql.unsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE;`);
    }
    console.log("All tables dropped.");
    process.exit(0);
}
main().catch(console.error);
//# sourceMappingURL=drop-db.js.map