declare const _default: (fastify: import("fastify").FastifyInstance<import("fastify").RawServerDefault, import("node:http").IncomingMessage, import("node:http").ServerResponse<import("node:http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>) => Promise<void>;
export default _default;
declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        requireSuperAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        requireTenantAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
//# sourceMappingURL=jwt.plugin.d.ts.map