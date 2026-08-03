import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
  override: true,
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"], {
    message:
      "NODE_ENV is required and must be development, production, or test",
  }),
  PORT: z
    .string({ message: "PORT is required" })
    .transform((val) => parseInt(val, 10)),

  DATABASE_URL: z.url({ message: "DATABASE_URL must be a valid URL" }),
  BCRYPT_SALT_ROUNDS: z
    .string({ message: "BCRYPT_SALT_ROUNDS is required" })
    .transform((val) => parseInt(val, 10)),

  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_ACCESS_SECRET_EXPIRES_IN: z
    .string()
    .min(1, "JWT_ACCESS_SECRET_EXPIRES_IN is required")
    .regex(
      /^\d+[smhd]$/,
      "Must be number + unit (s|m|h|d), e.g., 15m, 1h, 1d, 7d",
    ),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_REFRESH_SECRET_EXPIRES_IN: z
    .string()
    .min(1, "JWT_REFRESH_SECRET_EXPIRES_IN is required")
    .regex(
      /^\d+[smhd]$/,
      "Must be number + unit (s|m|h|d), e.g., 15m, 1h, 1d, 7d",
    ),

  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),

  ADMIN_EMAIL: z.email({ message: "ADMIN_EMAIL must be a valid email" }),
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid or missing environment variables:");
  const flattened = z.flattenError(parsedEnv.error);
  console.error(JSON.stringify(flattened.fieldErrors, null, 2));
  process.exit(1);
}

const env = parsedEnv.data;

const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,

  jwtAccessSecret: env.JWT_ACCESS_SECRET,
  jwtAccessSecretExpiresIn: env.JWT_ACCESS_SECRET_EXPIRES_IN,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtRefreshSecretExpiresIn: env.JWT_REFRESH_SECRET_EXPIRES_IN,

  stripeSecretKey: env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,

  adminEmail: env.ADMIN_EMAIL,
  adminPassword: env.ADMIN_PASSWORD,
};

export default config;
