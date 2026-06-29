export interface CoACredentials {
    ip: string;
    secret: string;
    port?: number;
}
export declare class RadiusCoAService {
    /**
     * Sends a Disconnect-Request (Packet type 40) to the Mikrotik NAS
     * to immediately terminate a user's session.
     */
    static disconnectUser({ ip, secret, port }: CoACredentials, username: string): Promise<boolean>;
}
//# sourceMappingURL=radius-coa.service.d.ts.map