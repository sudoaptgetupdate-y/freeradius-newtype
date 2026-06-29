import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/queue";
import { db } from "../db";
import { voucherBatches, vouchers } from "../schema/vouchers";
import { radcheck, radusergroup } from "../schema/freeradius";
import crypto from "crypto";

const generatePin = (length: number): string => {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let pin = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    pin += chars[(randomBytes[i] || 0) % chars.length];
  }
  return pin;
};

export const voucherWorker = new Worker(
  "voucher_generation",
  async (job: Job) => {
    const { tenantId, prefix, amount, groupname, type, codeLength, passwordLength } = job.data;
    
    // Create Batch
    const batch = await db.insert(voucherBatches).values({
      tenantId,
      prefix: prefix || "",
      amount,
      groupname,
      type: type || "code",
    }).returning();
    
    const batchId = batch[0]!.id;

    let successCount = 0;
    
    for (let i = 0; i < amount; i++) {
      let code = "";
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 5) {
        code = (prefix || "") + generatePin(codeLength || 6); // Total length varies
        
        // Check uniqueness in radcheck
        const existing = await db.query.radcheck.findFirst({
          where: (fields, { eq, and }) => 
            and(
              eq(fields.tenantId, tenantId),
              eq(fields.username, code)
            ),
        });
        
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error("Failed to generate unique code after 5 attempts");
      }
      
      const password = (type === "user_pass") ? generatePin(passwordLength || 6) : code;
      
      // Insert to vouchers table
      await db.insert(vouchers).values({
        batchId,
        tenantId,
        code,
        password: (type === "user_pass") ? password : null,
      });
      
      // Insert to radcheck (Cleartext-Password)
      await db.insert(radcheck).values({
        tenantId,
        username: code,
        attribute: "Cleartext-Password",
        op: ":=",
        value: password, // Username is Password for vouchers (unless user_pass)
      });
      
      // Bind to profile in radusergroup
      await db.insert(radusergroup).values({
        tenantId,
        username: code,
        groupname,
        priority: 1,
      });
      
      successCount++;
      await job.updateProgress(Math.round((successCount / amount) * 100));
    }

    return { batchId, successCount };
  },
  {
    connection: redisConnection as any,
    concurrency: 5,
  }
);

voucherWorker.on("completed", (job) => {
  console.log(`Job ${job.id} has completed!`);
});

voucherWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});

voucherWorker.on("error", (err) => {
  console.error(`Worker error: ${err.message}`);
});
