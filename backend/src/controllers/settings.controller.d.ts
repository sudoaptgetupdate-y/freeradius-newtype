import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
export declare const settingsSchema: z.ZodObject<{
    telegramToken: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    telegramBotId: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    telegramChatId: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    telegramEnabled: z.ZodDefault<z.ZodBoolean>;
    redisHost: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    redisPort: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    redisPassword: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    lokiUrl: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    vectorPort: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    smtpHost: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    smtpPort: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    smtpUser: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    smtpPassword: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    smtpSender: z.ZodPreprocess<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    timezone: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const getSettings: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
export declare const updateSettings: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
//# sourceMappingURL=settings.controller.d.ts.map