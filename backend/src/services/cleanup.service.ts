import { db } from "../db";
import { tenants } from "../schema/tenants";
import { radcheck, radacct, radusergroup, radreply } from "../schema/freeradius";
import { userOrganizations } from "../schema/organizations";
import { userinfo } from "../schema/userinfo";
import { eq, and, isNotNull, sql } from "drizzle-orm";

import { CronJob } from "cron";

export class CleanupService {
  private static job: CronJob | null = null;

  static async cleanDeletedUsers() {
    console.log("Starting Trash Bin cleanup job...");
    try {
      const tenantList = await db.select().from(tenants);

      for (const tenant of tenantList) {
        const retentionDays = tenant.trashRetentionDays ?? 30;

        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        // Find users to delete
        const usersToDelete = await db.select({ username: radcheck.username })
          .from(radcheck)
          .where(
            and(
              eq(radcheck.tenantId, tenant.id),
              isNotNull(radcheck.deletedAt),
              sql`${radcheck.deletedAt} < ${cutoffDate.toISOString()}`
            )
          );

        if (usersToDelete.length > 0) {
          const usernames = usersToDelete.map(u => u.username);
          console.log(`Tenant ${tenant.id}: Permanently deleting ${usernames.length} users (retention > ${retentionDays} days)`);

          for (const username of usernames) {
            await db.delete(radcheck).where(
              and(eq(radcheck.tenantId, tenant.id), eq(radcheck.username, username))
            );
            await db.delete(radreply).where(
              and(eq(radreply.tenantId, tenant.id), eq(radreply.username, username))
            );
            await db.delete(radusergroup).where(
              and(eq(radusergroup.tenantId, tenant.id), eq(radusergroup.username, username))
            );
            await db.delete(userOrganizations).where(
              and(eq(userOrganizations.tenantId, tenant.id), eq(userOrganizations.username, username))
            );
            await db.delete(userinfo).where(
              and(eq(userinfo.tenantId, tenant.id), eq(userinfo.username, username))
            );
          }
        }
      }
      console.log("Trash Bin cleanup job completed.");
    } catch (error) {
      console.error("Error during Trash Bin cleanup job", error);
    }
  }

  static start() {
    if (this.job) return;

    // Run every day at 3:00 AM
    this.job = new CronJob("0 3 * * *", () => {
      this.cleanDeletedUsers();
    });

    this.job.start();
    console.log("Trash Bin cleanup background service started.");
  }

  static stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
    }
  }
}
