import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "../shared/infrastructure/database.ts";
import type { Identity } from "./index.ts";
import { accounts, sessions, users, verifications } from "./infrastructure/identitySchema.ts";

export interface AuthConfig {
  secret: string;
  /** Public origin the browser sees; /api/auth is proxied to the API from there. */
  baseUrl: string;
  google: { clientId: string; clientSecret: string };
}

export interface IdentityHooks {
  /** Runs after sign-up; a failure is reported but never blocks the sign-in. */
  onUserCreated(userId: string): Promise<void>;
  onHookError(error: unknown): void;
}

export function createIdentity(db: Database, config: AuthConfig, hooks: IdentityHooks): Identity {
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
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await hooks.onUserCreated(user.id).catch(hooks.onHookError);
          },
        },
      },
    },
    telemetry: { enabled: false },
  });

  return {
    handler: (request) => auth.handler(request),
    currentUserId: async (headers) => (await auth.api.getSession({ headers }))?.user.id ?? null,
  };
}
