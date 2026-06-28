import { FastifyRequest, FastifyReply } from "fastify";
export declare const getTenants: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare const createTenant: (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
export declare const updateTenant: (request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply) => Promise<undefined>;
export declare const deleteTenant: (request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply) => Promise<undefined>;
//# sourceMappingURL=tenants.controller.d.ts.map