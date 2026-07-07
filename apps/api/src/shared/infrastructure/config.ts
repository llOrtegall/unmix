export interface Config {
  port: number;
  webOrigin: string;
  databaseUrl: string;
  redisUrl: string;
  s3: { endpoint: string; publicEndpoint: string; region: string; accessKey: string; secretKey: string; bucket: string };
  maxUploadBytes: number;
  demucsModel: string;
  logLevel: string;
  auth: { secret: string; baseUrl: string; google: { clientId: string; clientSecret: string } };
}

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export function loadConfig(): Config {
  const endpoint = env("S3_ENDPOINT");
  const webOrigin = env("WEB_ORIGIN", "http://localhost:5173");
  return {
    port: Number(env("API_PORT", "3000")),
    webOrigin,
    databaseUrl: env("DATABASE_URL"),
    redisUrl: env("REDIS_URL"),
    s3: {
      endpoint,
      // Browsers need a host they can reach; inside Docker the API talks to s3:8333.
      publicEndpoint: env("S3_PUBLIC_ENDPOINT", endpoint),
      region: env("S3_REGION", "us-east-1"),
      accessKey: env("S3_ACCESS_KEY"),
      secretKey: env("S3_SECRET_KEY"),
      bucket: env("S3_BUCKET"),
    },
    maxUploadBytes: Number(env("MAX_UPLOAD_MB", "200")) * 1_048_576,
    demucsModel: env("DEMUCS_MODEL", "htdemucs_6s"),
    logLevel: env("LOG_LEVEL", "info").toLowerCase(),
    auth: {
      secret: env("BETTER_AUTH_SECRET"),
      // The browser reaches /api/auth through the web origin (Vite or nginx proxy).
      baseUrl: env("BETTER_AUTH_URL", webOrigin),
      google: { clientId: env("GOOGLE_CLIENT_ID"), clientSecret: env("GOOGLE_CLIENT_SECRET") },
    },
  };
}
