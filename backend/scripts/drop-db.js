import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();
const sql = postgres(process.env.DATABASE_URL);
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