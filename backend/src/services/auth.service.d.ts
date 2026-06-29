import { z } from "zod";
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const authService: {
    login: (input: LoginInput) => Promise<{
        id: string;
        email: string;
        role: "super_admin" | "master_staff" | "tenant_admin" | "tenant_staff";
        tenantId: string | null;
    }>;
};
//# sourceMappingURL=auth.service.d.ts.map