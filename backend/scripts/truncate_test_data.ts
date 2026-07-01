import { db } from "../src/db/index.js";
import { sql } from "drizzle-orm";

async function truncateTestData() {
  console.log("Starting safe database cleanup...");
  
  const tables = [
    "userinfo",
    "radcheck",
    "radreply",
    "radusergroup",
    "user_organizations",
    "organizations",
    "radacct",
    "radpostauth"
  ];
  
  try {
    console.log(`Truncating tables: ${tables.join(", ")}`);
    // Run truncation query with CASCADE to handle foreign key dependencies, and RESTART IDENTITY to reset auto-increment counters
    await db.execute(sql`
      TRUNCATE TABLE 
        userinfo, 
        radcheck, 
        radreply, 
        radusergroup, 
        user_organizations, 
        organizations, 
        radacct, 
        radpostauth 
      RESTART IDENTITY CASCADE;
    `);
    console.log("Database clean up successful! All user, group, and session history tables have been reset.");
    process.exit(0);
  } catch (error) {
    console.error("Error during database truncation:", error);
    process.exit(1);
  }
}

truncateTestData();
