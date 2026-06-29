import axios from "axios";
import https from "https";

// We create an HTTPS agent that ignores self-signed certificate errors, 
// which is extremely common for Mikrotik routers.
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export interface MikrotikCredentials {
  ip: string;
  username?: string;
  password?: string;
}

export class MikrotikService {
  /**
   * Helper to create an axios instance configured for a specific Mikrotik device
   */
  private static getClient({ ip, username, password }: MikrotikCredentials) {
    if (!username || !password) {
      throw new Error("Missing Mikrotik API credentials");
    }

    return axios.create({
      baseURL: `https://${ip}/rest`,
      httpsAgent,
      timeout: 5000, // 5 second timeout as per SKILL.md
      auth: {
        username,
        password,
      },
    });
  }

  /**
   * Fetches system resources (CPU, Memory, Uptime)
   */
  static async getSystemResource(credentials: MikrotikCredentials) {
    try {
      const client = this.getClient(credentials);
      const response = await client.get("/system/resource");
      // Mikrotik REST API usually returns data in an array or an object
      return response.data;
    } catch (error: any) {
      console.error(`[MikrotikService] getSystemResource failed for ${credentials.ip}:`, error.message);
      throw new Error("Failed to connect to Mikrotik RouterOS");
    }
  }

  /**
   * Fetches DHCP Leases
   */
  static async getDhcpLeases(credentials: MikrotikCredentials) {
    try {
      const client = this.getClient(credentials);
      const response = await client.get("/ip/dhcp-server/lease");
      return response.data;
    } catch (error: any) {
      console.error(`[MikrotikService] getDhcpLeases failed for ${credentials.ip}:`, error.message);
      throw new Error("Failed to fetch DHCP leases");
    }
  }

  /**
   * Kicks a user from Hotspot active sessions
   * (Optional fallback if CoA is not working, though CoA is preferred)
   */
  static async kickHotspotUser(credentials: MikrotikCredentials, username: string) {
    try {
      const client = this.getClient(credentials);
      
      // 1. Find the active session ID for the user
      const findRes = await client.get(`/ip/hotspot/active?user=${username}`);
      const activeSessions = Array.isArray(findRes.data) ? findRes.data : [];
      
      if (activeSessions.length === 0) {
        return { success: true, message: "User is not currently active" };
      }

      // 2. Remove the session
      for (const session of activeSessions) {
        if (session['.id']) {
          await client.post('/ip/hotspot/active/remove', {
            ".id": session['.id']
          });
        }
      }

      return { success: true, message: `Kicked user ${username} from hotspot` };
    } catch (error: any) {
      console.error(`[MikrotikService] kickHotspotUser failed for ${credentials.ip}:`, error.message);
      throw new Error("Failed to kick hotspot user via API");
    }
  }
}
