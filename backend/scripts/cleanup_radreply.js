import { db } from "../src/db/index.js";
import { radreply } from "../src/schema/freeradius.js";
import { userinfo } from "../src/schema/userinfo.js";
import { inArray, and, eq } from "drizzle-orm";
async function cleanup() {
    console.log("Cleaning up radreply custom attributes...");
    const customAttributes = [
        "User-First-Name",
        "User-Last-Name",
        "User-Member-Id",
        "User-Citizen-Id",
        "User-Email",
        "User-Phone"
    ];
    // Actually, wait, do I need to migrate data?
    // Let's migrate them to userinfo first before deleting them, just in case!
    console.log("Fetching custom attributes to migrate...");
    const records = await db.select().from(radreply).where(inArray(radreply.attribute, customAttributes));
    console.log(`Found ${records.length} records. Migrating to userinfo...`);
    const userMap = new Map();
    for (const r of records) {
        const key = `${r.tenantId}:${r.username}`;
        if (!userMap.has(key)) {
            userMap.set(key, { tenantId: r.tenantId, username: r.username });
        }
        const data = userMap.get(key);
        if (r.attribute === "User-First-Name")
            data.firstName = r.value;
        if (r.attribute === "User-Last-Name")
            data.lastName = r.value;
        if (r.attribute === "User-Member-Id")
            data.memberId = r.value;
        if (r.attribute === "User-Citizen-Id")
            data.citizenId = r.value;
        if (r.attribute === "User-Email")
            data.email = r.value;
        if (r.attribute === "User-Phone")
            data.phone = r.value;
    }
    const toInsert = Array.from(userMap.values());
    for (const user of toInsert) {
        // Check if exists
        const existing = await db.select().from(userinfo).where(and(eq(userinfo.tenantId, user.tenantId), eq(userinfo.username, user.username))).limit(1);
        if (existing.length === 0) {
            await db.insert(userinfo).values(user);
        }
    }
    console.log(`Migrated ${toInsert.length} users to userinfo.`);
    // Now delete from radreply
    console.log("Deleting custom attributes from radreply...");
    const deleteResult = await db.delete(radreply).where(inArray(radreply.attribute, customAttributes));
    console.log("Cleanup complete!");
    process.exit(0);
}
cleanup().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=cleanup_radreply.js.map