import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10),
  PORT: z.string().default("3000"),
  HOST: z.string().default("0.0.0.0"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:");
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
