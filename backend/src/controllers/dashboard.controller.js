"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFailedLogins = exports.getDashboardStats = void 0;
const fastify_1 = require("fastify");
const db_1 = require("../db");
const tenants_1 = require("../schema/tenants");
const freeradius_1 = require("../schema/freeradius");
const drizzle_orm_1 = require("drizzle-orm");
const getDashboardStats = async (request, reply) => {
    try {
        const user = request.user;
        // Total Tenants (Only Super Admins can see this across all, others see 1)
        let totalTenants = 1;
        if (user.role === 'super_admin') {
            const tenantCount = await db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(tenants_1.tenants);
            totalTenants = tenantCount[0].count;
        }
        // Online Users (from radacct where acctstoptime is null)
        let onlineUsersQuery = db_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(freeradius_1.radacct)
            .where((0, drizzle_orm_1.isNull)(freeradius_1.radacct.acctstoptime));
        // If not super admin, isolate by tenantId
        if (user.role !== 'super_admin') {
            onlineUsersQuery = db_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(freeradius_1.radacct)
                .where((0, drizzle_orm_1.sql) `${freeradius_1.radacct.acctstoptime} IS NULL AND ${freeradius_1.radacct.tenantId} = ${user.tenantId}`);
        }
        const onlineUsersRes = await onlineUsersQuery;
        const onlineUsers = onlineUsersRes[0].count;
        // Total Traffic (Sum of acctinputoctets and acctoutputoctets)
        let trafficQuery = db_1.db
            .select({
            download: (0, drizzle_orm_1.sum)(freeradius_1.radacct.acctoutputoctets).mapWith(Number), // NAS Output = User Download
            upload: (0, drizzle_orm_1.sum)(freeradius_1.radacct.acctinputoctets).mapWith(Number), // NAS Input = User Upload
        })
            .from(freeradius_1.radacct);
        if (user.role !== 'super_admin') {
            trafficQuery = db_1.db
                .select({
                download: (0, drizzle_orm_1.sum)(freeradius_1.radacct.acctoutputoctets).mapWith(Number),
                upload: (0, drizzle_orm_1.sum)(freeradius_1.radacct.acctinputoctets).mapWith(Number),
            })
                .from(freeradius_1.radacct)
                .where((0, drizzle_orm_1.eq)(freeradius_1.radacct.tenantId, user.tenantId));
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
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
    }
};
exports.getDashboardStats = getDashboardStats;
const getFailedLogins = async (request, reply) => {
    try {
        const user = request.user;
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
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to fetch logs from Loki" });
    }
};
exports.getFailedLogins = getFailedLogins;
//# sourceMappingURL=dashboard.controller.js.map