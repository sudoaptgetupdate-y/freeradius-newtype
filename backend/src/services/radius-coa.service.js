import dgram from "dgram";
import radius from "radius";
export class RadiusCoAService {
    /**
     * Sends a Disconnect-Request (Packet type 40) to the Mikrotik NAS
     * to immediately terminate a user's session.
     */
    static async disconnectUser({ ip, secret, port = 3799 }, username) {
        return new Promise((resolve, reject) => {
            // FreeRADIUS and Mikrotik use port 3799 for CoA / Disconnect messages by default
            const client = dgram.createSocket("udp4");
            const packet = radius.encode({
                code: "Disconnect-Request", // Type 40
                secret: secret,
                attributes: [
                    ["User-Name", username]
                ]
            });
            console.log(`[RadiusCoAService] Sending Disconnect-Request for ${username} to ${ip}:${port}`);
            // Adding a timeout in case NAS doesn't respond
            const timeout = setTimeout(() => {
                client.close();
                console.warn(`[RadiusCoAService] Timeout waiting for Disconnect-ACK from ${ip}`);
                resolve(false);
            }, 3000); // 3 seconds timeout
            client.on("message", (msg) => {
                clearTimeout(timeout);
                try {
                    const response = radius.decode({ packet: msg, secret: secret });
                    console.log(`[RadiusCoAService] Received ${response.code} from ${ip}`);
                    client.close();
                    // Usually, Mikrotik replies with Disconnect-ACK (Type 41) or Disconnect-NAK (Type 42)
                    if (response.code === "Disconnect-ACK") {
                        resolve(true);
                    }
                    else {
                        console.warn(`[RadiusCoAService] Failed to disconnect, NAS replied with: ${response.code}`);
                        resolve(false);
                    }
                }
                catch (err) {
                    client.close();
                    console.error(`[RadiusCoAService] Failed to decode response from ${ip}:`, err);
                    resolve(false);
                }
            });
            client.on("error", (err) => {
                clearTimeout(timeout);
                client.close();
                console.error(`[RadiusCoAService] UDP Socket error:`, err);
                reject(err);
            });
            client.send(packet, 0, packet.length, port, ip, (err) => {
                if (err) {
                    clearTimeout(timeout);
                    client.close();
                    console.error(`[RadiusCoAService] Failed to send packet to ${ip}:`, err);
                    reject(err);
                }
            });
        });
    }
}
//# sourceMappingURL=radius-coa.service.js.map