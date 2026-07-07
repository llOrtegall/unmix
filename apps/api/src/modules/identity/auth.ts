import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "../../shared/infrastructure/db.ts";
import type { Identity } from "./index.ts";
import { accounts, sessions, users, verifications } from "./schema.ts";

export interface AuthConfig {
  secret: string;
  /** Public origin the browser sees; /api/auth is proxied to the API from there. */
  baseUrl: string;
  google: { clientId: string; clientSecret: string };
}

export function createIdentity(db: Database, config: AuthConfig): Identity {
  const auth = betterAuth({
    secret: config.secret,
    baseURL: config.baseUrl,
    basePath: "/api/auth",
    trustedOrigins: [config.baseUrl],
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: { users, sessions, accounts, verifications },
    }),
    advanced: { database: { generateId: "uuid" } },
    socialProviders: {
      google: { clientId: config.google.clientId, clientSecret: config.google.clientSecret, prompt: "select_account" },
    },
    telemetry: { enabled: false },
  });

  return {
    handler: (request) => auth.handler(request),
    currentUserId: async (headers) => (await auth.api.getSession({ headers }))?.user.id ?? null,
  };
}
