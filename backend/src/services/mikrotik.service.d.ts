export interface MikrotikCredentials {
    ip: string;
    username?: string;
    password?: string;
}
export declare class MikrotikService {
    /**
     * Helper to create an axios instance configured for a specific Mikrotik device
     */
    private static getClient;
    /**
     * Fetches system resources (CPU, Memory, Uptime)
     */
    static getSystemResource(credentials: MikrotikCredentials): Promise<any>;
    /**
     * Fetches DHCP Leases
     */
    static getDhcpLeases(credentials: MikrotikCredentials): Promise<any>;
    /**
     * Kicks a user from Hotspot active sessions
     * (Optional fallback if CoA is not working, though CoA is preferred)
     */
    static kickHotspotUser(credentials: MikrotikCredentials, username: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=mikrotik.service.d.ts.map