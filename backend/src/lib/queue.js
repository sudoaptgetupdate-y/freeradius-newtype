import { Queue } from "bullmq";
import { env } from "../env";
import IORedis from "ioredis";
import { db } from "../db";
import { globalSettings } from "../schema/settings";
// Fetch global settings to configure Redis dynamically
let redisUrl = env.REDIS_URL;
try {
    const settings = await db.select().from(globalSettings).limit(1);
    if (settings.length > 0 && settings[0].redisHost) {
        const s = settings[0];
        const passwordPart = s.redisPassword ? `:${s.redisPassword}@` : "";
        redisUrl = `redis://${passwordPart}${s.redisHost}:${s.redisPort || 6379}`;
    }
}
catch (error) {
    console.warn("⚠️ Could not fetch Redis settings from DB, falling back to .env");
}
export const redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
});
redisConnection.on("error", (error) => {
    // Gracefully log the error without crashing the process
    console.warn("⚠️ Redis Connection Error:", error.message);
});
export const voucherQueue = new Queue("voucher_generation", {
    connection: redisConnection,
});
//# sourceMappingURL=queue.js.map