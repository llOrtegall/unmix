import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { DomainEventList } from "../../shared/domain/DomainEventList.ts";
import type { EventRepository } from "../../shared/domain/EventRepository.ts";
import { UserId } from "../../shared/domain/UserId.ts";
import type { Database } from "../../shared/infrastructure/database.ts";
import { UserRegistered } from "../domain/UserRegistered.ts";
import { accounts, sessions, users, verifications } from "./identitySchema.ts";

export interface AuthSettings {
  readonly secret: string;
  /** Public origin the browser sees; /api/auth is proxied to the API from there. */
  readonly baseUrl: string;
  readonly google: { readonly clientId: string; readonly clientSecret: string };
}

export const createBetterAuth = (db: Database, settings: AuthSettings, eventRepository: EventRepository) =>
  betterAuth({
    secret: settings.secret,
    baseURL: settings.baseUrl,
    basePath: "/api/auth",
    trustedOrigins: [settings.baseUrl],
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: { users, sessions, accounts, verifications },
    }),
    advanced: { database: { generateId: "uuid" } },
    socialProviders: {
      google: { clientId: settings.google.clientId, clientSecret: settings.google.clientSecret, prompt: "select_account" },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await eventRepository.publish(DomainEventList.empty().add(UserRegistered.occur(UserId.fromPrimitive(user.id))));
          },
        },
      },
    },
    telemetry: { enabled: false },
  });

export type BetterAuth = ReturnType<typeof createBetterAuth>;
