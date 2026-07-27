import { config } from "../../../config.ts";
import { BetterAuthSessionRepository } from "../infrastructure/BetterAuthSessionRepository.ts";
import { HttpSessionExpiryRepository } from "../infrastructure/HttpSessionExpiryRepository.ts";
import { findCurrentUser } from "./findCurrentUser.ts";
import { signInWithGoogle } from "./signInWithGoogle.ts";
import { signOut } from "./signOut.ts";
import { watchSessionExpiry } from "./watchSessionExpiry.ts";

export const sessionModule = (authBasePath: string) => {
  const sessionRepository = new BetterAuthSessionRepository(authBasePath);
  const sessionExpiryRepository = new HttpSessionExpiryRepository();

  return {
    findCurrentUser: findCurrentUser({ sessionRepository }),
    signInWithGoogle: signInWithGoogle({ sessionRepository }),
    signOut: signOut({ sessionRepository }),
    watchSessionExpiry: watchSessionExpiry({ sessionExpiryRepository }),
  };
};

export type SessionModule = ReturnType<typeof sessionModule>;

export const session = sessionModule(config.authBasePath);
