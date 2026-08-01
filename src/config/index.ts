import { configDotenv } from "dotenv";
import { env } from "process";
import jwt from "jsonwebtoken";
configDotenv({
  quiet: true,
});

const config = {
  NODE_ENV: env.NODE_ENV!,
  PORT: env.PORT!,
  DATABASE_URL: env.DATABASE_URL!,

  JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET!,
  JWT_ACCESS_EXPIRES_IN:
    env.JWT_ACCESS_EXPIRES_IN! as jwt.SignOptions["expiresIn"],
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN:
    env.JWT_REFRESH_EXPIRES_IN! as jwt.SignOptions["expiresIn"],

  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET!,

  ADMIN_EMAIL: env.ADMIN_EMAIL!,
  ADMIN_PASSWORD: env.ADMIN_PASSWORD!,
};

export default config;
