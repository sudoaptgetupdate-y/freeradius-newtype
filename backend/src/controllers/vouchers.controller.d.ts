import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
export declare const generateVouchersSchema: z.ZodObject<{
    amount: z.ZodNumber;
    groupname: z.ZodString;
    prefix: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        code: "code";
        user_pass: "user_pass";
    }>>>;
    codeLength: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    passwordLength: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const generateVouchers: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
export declare const getJobStatus: (request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply) => Promise<never>;
export declare const getVoucherBatches: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
export declare const getVouchers: (request: FastifyRequest<{
    Querystring: {
        batchId: string;
    };
}>, reply: FastifyReply) => Promise<never>;
export declare const getVoucherSettings: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
export declare const updateVoucherSettingsSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    defaultPrefix: z.ZodPreprocess<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    logoUrl: z.ZodPreprocess<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    headerText: z.ZodPreprocess<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    ssidName: z.ZodPreprocess<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    footerText: z.ZodPreprocess<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, z.core.$strip>;
export declare const updateVoucherSettings: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
//# sourceMappingURL=vouchers.controller.d.ts.map