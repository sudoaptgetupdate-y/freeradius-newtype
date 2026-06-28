import { FastifyRequest, FastifyReply } from "fastify";
export declare const getNasList: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare const createNas: (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
export declare const updateNas: (request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply) => Promise<undefined>;
export declare const deleteNas: (request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply) => Promise<undefined>;
//# sourceMappingURL=nas.controller.d.ts.map