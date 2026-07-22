// Public API of the identity module (Better Auth, no DDD layers; ADR 0009).
export interface Identity {
  /** Better Auth's fetch-style handler for everything under /api/auth. */
  handler(request: Request): Promise<Response>;
  /** The signed-in user's id, or null without a valid session. */
  currentUserId(headers: Headers): Promise<string | null>;
}

/** Other modules reference users only through foreign keys. */
export { users } from "./infrastructure/identitySchema.ts";
