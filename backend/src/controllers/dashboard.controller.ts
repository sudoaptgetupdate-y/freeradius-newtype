import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { tenants } from "../schema/tenants";
import { radacct } from "../schema/freeradius";
import { count, isNull, eq, sum, sql } from "drizzle-orm";

export const getDashboardStats = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    
    // Total Tenants (Only Super Admins can see this across all, others see 1)
    let totalTenants = 1;
    if (user.role === 'super_admin') {
      const tenantCount = await db.select({ count: count() }).from(tenants);
      totalTenants = tenantCount[0].count;
    }

    // Online Users (from radacct where acctstoptime is null)
    let onlineUsersQuery = db
      .select({ count: count() })
      .from(radacct)
      .where(isNull(radacct.acctstoptime));

    // If not super admin, isolate by tenantId
    if (user.role !== 'super_admin') {
      onlineUsersQuery = db
        .select({ count: count() })
        .from(radacct)
        .where(
          sql`${radacct.acctstoptime} IS NULL AND ${radacct.tenantId} = ${user.tenantId}`
        );
    }
    const onlineUsersRes = await onlineUsersQuery;
    const onlineUsers = onlineUsersRes[0].count;

    // Total Traffic (Sum of acctinputoctets and acctoutputoctets)
    let trafficQuery = db
      .select({
        download: sum(radacct.acctoutputoctets).mapWith(Number), // NAS Output = User Download
        upload: sum(radacct.acctinputoctets).mapWith(Number),   // NAS Input = User Upload
      })
      .from(radacct);

    if (user.role !== 'super_admin') {
      trafficQuery = db
        .select({
          download: sum(radacct.acctoutputoctets).mapWith(Number),
          upload: sum(radacct.acctinputoctets).mapWith(Number),
        })
        .from(radacct)
        .where(eq(radacct.tenantId, user.tenantId));
    }

    const trafficRes = await trafficQuery;
    const download = trafficRes[0]?.download || 0;
    const upload = trafficRes[0]?.upload || 0;
    const totalTrafficBytes = download + upload;

    // Convert to GB for easy display (simplified)
    const trafficGB = (totalTrafficBytes / (1024 * 1024 * 1024)).toFixed(2);

    // Mock tenant specific metrics
    let activeVouchers = 0;
    let routerStatus = "unknown";

    if (user.role !== 'super_admin') {
      activeVouchers = 124; // Mock value for active vouchers at this site
      routerStatus = "online"; // Mock value
    }

    return reply.send({
      totalTenants,
      onlineUsers,
      totalTrafficBytes,
      trafficGB: `${trafficGB} GB`,
      activeVouchers,
      routerStatus,
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
};

export const getFailedLogins = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    
    // MOCK DATA: Simulate Grafana Loki response
    // In the future, this will use axios to query Loki using LogQL
    // Example LogQL: `{tenant_id="tenant-123"} |= "Login incorrect" | json`
    
    let mockLogs = [
      { id: "1", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), username: "john_doe", mac: "AA:BB:CC:DD:EE:11", reason: "Wrong Password" },
      { id: "2", timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), username: "admin", mac: "11:22:33:44:55:66", reason: "Account Suspended" },
      { id: "3", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), username: "test_user", mac: "FF:EE:DD:CC:BB:AA", reason: "Wrong Password" },
      { id: "4", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), username: "guest", mac: "00:11:22:33:44:55", reason: "Invalid MAC Address" },
      { id: "5", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), username: "john_doe", mac: "AA:BB:CC:DD:EE:11", reason: "Wrong Password" },
    ];

    // Simulate tenant isolation (if tenant_admin, maybe they only see fewer logs)
    if (user.role !== 'super_admin') {
      // Just slice it to make it look different for tenant admins
      mockLogs = mockLogs.slice(0, 3);
    }

    return reply.send({
      logs: mockLogs
    });

  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: "Failed to fetch logs from Loki" });
  }
};
