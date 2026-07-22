import type { SessionRepository } from "../domain/SessionRepository.ts";

// Better Auth owns the whole /api/auth protocol (OAuth redirect, callback, session, sign-out).
export const handleAuthRequest =
  ({ sessionRepository }: { sessionRepository: SessionRepository }) =>
  (request: Request): Promise<Response> =>
    sessionRepository.handle(request);
