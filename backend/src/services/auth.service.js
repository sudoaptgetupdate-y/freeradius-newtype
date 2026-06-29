import { db } from "../db";
import { admins } from "../schema/admins";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export const authService = {
    login: async (input) => {
        const adminList = await db.select().from(admins).where(eq(admins.email, input.email)).limit(1);
        if (adminList.length === 0) {
            throw new Error("Invalid email or password");
        }
        const admin = adminList[0];
        if (!admin || !admin.passwordHash) {
            throw new Error("Invalid email or password");
        }
        const isPasswordValid = await bcrypt.compare(input.password, admin.passwordHash);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }
        return {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            tenantId: admin.tenantId,
        };
    }
};
//# sourceMappingURL=auth.service.js.map