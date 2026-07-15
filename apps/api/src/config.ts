import { z } from "zod";

const BYTES_PER_MEGABYTE = 1_048_576;

const environment = z.object({
  API_PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  S3_ENDPOINT: z.url(),
  // Browsers need a host they can reach; inside Docker the API talks to s3:8333.
  S3_PUBLIC_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET: z.string().min(1),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(200),
  DEMUCS_MODEL: z.string().default("htdemucs_6s"),
  LOG_LEVEL: z.string().default("info"),
  BETTER_AUTH_SECRET: z.string(),
  // The browser reaches /api/auth through the web origin (Vite or nginx proxy).
  BETTER_AUTH_URL: z.url().optional(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
});

export const config = environment
  .transform((env) => ({
    port: env.API_PORT,
    webOrigin: env.WEB_ORIGIN,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    s3: {
      endpoint: env.S3_ENDPOINT,
      publicEndpoint: env.S3_PUBLIC_ENDPOINT ?? env.S3_ENDPOINT,
      region: env.S3_REGION,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
      bucket: env.S3_BUCKET,
    },
    maxUploadBytes: env.MAX_UPLOAD_MB * BYTES_PER_MEGABYTE,
    demucsModel: env.DEMUCS_MODEL,
    logLevel: env.LOG_LEVEL.toLowerCase(),
    auth: {
      secret: env.BETTER_AUTH_SECRET,
      baseUrl: env.BETTER_AUTH_URL ?? env.WEB_ORIGIN,
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    },
  }))
  .parse(process.env);

export type Config = typeof config;
