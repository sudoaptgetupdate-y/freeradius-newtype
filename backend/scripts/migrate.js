import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is missing");
}
const migrationClient = postgres(connectionString, { max: 1 });
async function main() {
    console.log("Running migrations...");
    await migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });
    console.log("Migrations complete!");
    process.exit(0);
}
main().catch((err) => {
    console.error("Migration failed!", err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map