import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
export declare const updateSettingsSchema: z.ZodObject<{
    orgName: z.ZodString;
    logoUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    termsOfService: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    footerNote: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    isRegisterEnabled: z.ZodBoolean;
    isSocialLoginEnabled: z.ZodBoolean;
    themeColor: z.ZodString;
    welcomeMessage: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    leftBgColor: z.ZodString;
    leftTextColor: z.ZodString;
    leftAccentColor: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
    googleClientIdOverride: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    googleClientSecretOverride: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    lineChannelIdOverride: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    lineChannelSecretOverride: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    telegramEnabled: z.ZodOptional<z.ZodBoolean>;
    telegramChatId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const registerUserSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Public endpoint to fetch portal settings by tenantId
 */
export declare const getPortalSettings: (request: FastifyRequest<{
    Params: {
        tenantId: string;
    };
}>, reply: FastifyReply) => Promise<never>;
/**
 * Protected endpoint to fetch portal settings by tenantId (includes overrides)
 */
export declare const getPortalSettingsAdmin: (request: FastifyRequest<{
    Params: {
        tenantId: string;
    };
}>, reply: FastifyReply) => Promise<never>;
/**
 * Protected endpoint to update portal settings
 */
export declare const updatePortalSettings: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
/**
 * Public endpoint for Self-Registration
 */
export declare const registerUser: (request: FastifyRequest<{
    Params: {
        tenantId: string;
    };
}>, reply: FastifyReply) => Promise<never>;
/**
 * Send a test Telegram message to check connection
 */
export declare const testTelegramSettings: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
//# sourceMappingURL=portal.controller.d.ts.map