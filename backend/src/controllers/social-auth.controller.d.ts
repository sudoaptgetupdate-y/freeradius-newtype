import type { FastifyRequest, FastifyReply } from "fastify";
export declare const socialLoginRedirect: (request: FastifyRequest<{
    Params: {
        tenantId: string;
        provider: "google" | "line";
    };
    Querystring: any;
}>, reply: FastifyReply) => Promise<never>;
export declare const socialLoginCallback: (request: FastifyRequest<{
    Params: {
        provider: "google" | "line";
    };
    Querystring: {
        code: string;
        state: string;
        error?: string;
    };
}>, reply: FastifyReply) => Promise<never>;
//# sourceMappingURL=social-auth.controller.d.ts.map