import { db } from "../src/db";
import { admins } from "../src/schema/admins";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const seed = async () => {
  console.log("Seeding Super Admin...");
  
  const email = "arichai.ko@gmail.com";
  const password = "lkfgxifde";

  // Check if exists
  const existing = await db.select().from(admins).where(eq(admins.email, email));
  if (existing.length > 0) {
    console.log("Super admin already exists!");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(admins).values({
    email,
    passwordHash,
    firstName: "System",
    lastName: "Admin",
    status: "active",
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
