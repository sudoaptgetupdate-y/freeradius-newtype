import { db } from "../src/db";
import { tenants } from "../src/schema/tenants";
import { radcheck, radacct } from "../src/schema/freeradius";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function run() {
  console.log("Seeding dummy RADIUS data...");

  // 1. Get or create a tenant
  let tenantRes = await db.select().from(tenants).limit(1);
  let tenantId;
  
  if (tenantRes.length === 0) {
    console.log("No tenant found. Creating a dummy admin tenant...");
    const newTenant = await db.insert(tenants).values({
      name: "Default SAAS Tenant",
    }).returning();
    tenantId = newTenant[0]!.id;
  } else {
    tenantId = tenantRes[0]!.id;
  }

  // 2. Insert dummy users into radcheck
  const mockUsers = [
    { username: "john.doe", password: "password123" },
    { username: "sarah.smith", password: "password123" },
    { username: "mike_w", password: "password123" },
    { username: "guest_user_1", password: "password123" },
    { username: "emily.r", password: "password123" },
  ];

  for (const user of mockUsers) {
    // Check if exists
    const existing = await db
      .select()
      .from(radcheck)
      .where(eq(radcheck.username, user.username));
    
    if (existing.length === 0) {
      await db.insert(radcheck).values({
        tenantId,
        username: user.username,
        attribute: "Cleartext-Password",
        op: "==",
        value: user.password,
      });
      console.log(`Inserted user: ${user.username}`);
    }
  }

  // 3. Insert active and inactive sessions into radacct
  // Active session for john.doe
  await db.insert(radacct).values({
    tenantId,
    acctsessionid: randomUUID().substring(0, 32),
    acctuniqueid: randomUUID().substring(0, 32),
    username: "john.doe",
    nasipaddress: "10.0.0.1",
    framedipaddress: "192.168.1.10",
    callingstationid: "00:1A:2B:3C:4D:5E",
    acctstarttime: new Date(Date.now() - 3600000), // 1 hour ago
    acctstoptime: null, // Active
    acctinputoctets: 1500000000, // 1.5 GB
    acctoutputoctets: 2000000000, // 2 GB
  });

  // Active session for sarah.smith
  await db.insert(radacct).values({
    tenantId,
    acctsessionid: randomUUID().substring(0, 32),
    acctuniqueid: randomUUID().substring(0, 32),
    username: "sarah.smith",
    nasipaddress: "10.0.0.1",
    framedipaddress: "192.168.1.15",
    callingstationid: "11:22:33:44:55:66",
    acctstarttime: new Date(Date.now() - 7200000), // 2 hours ago
    acctstoptime: null, // Active
    acctinputoctets: 500000000, // 500 MB
    acctoutputoctets: 1800000000, // 1.8 GB
  });

  // Inactive session for emily.r
  await db.insert(radacct).values({
    tenantId,
    acctsessionid: randomUUID().substring(0, 32),
    acctuniqueid: randomUUID().substring(0, 32),
    username: "emily.r",
    nasipaddress: "10.0.0.1",
    framedipaddress: "192.168.1.99",
    callingstationid: "AB:CD:EF:12:34:56",
    acctstarttime: new Date(Date.now() - 86400000), // 1 day ago
    acctstoptime: new Date(Date.now() - 82800000), // Stopped
    acctinputoctets: 1000000,
    acctoutputoctets: 2000000,
  });

  console.log("Seeding complete!");
  process.exit(0);
}

run().catch(console.error);
