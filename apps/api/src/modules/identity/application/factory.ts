import type { EventRepository } from "../../shared/domain/EventRepository.ts";
import type { Database } from "../../shared/infrastructure/database.ts";
import { BetterAuthSessionRepository } from "../infrastructure/BetterAuthSessionRepository.ts";
import { type AuthSettings, createBetterAuth } from "../infrastructure/createBetterAuth.ts";
import { findSessionUser } from "./findSessionUser.ts";
import { handleAuthRequest } from "./handleAuthRequest.ts";

export const identityModule = (db: Database, settings: AuthSettings, eventRepository: EventRepository) => {
  const sessionRepository = new BetterAuthSessionRepository(createBetterAuth(db, settings, eventRepository));

  return {
    findSessionUser: findSessionUser({ sessionRepository }),
    handleAuthRequest: handleAuthRequest({ sessionRepository }),
  };
};

export type IdentityModule = ReturnType<typeof identityModule>;
