import type { UserId } from "../../shared/domain/UserId.ts";
import { SessionCookies } from "../domain/SessionCookies.ts";
import type { SessionRepository } from "../domain/SessionRepository.ts";

export const findSessionUser =
  ({ sessionRepository }: { sessionRepository: SessionRepository }) =>
  async (cookies: string): Promise<UserId | null> => {
    const sessionCookies = SessionCookies.create(cookies);
    if (sessionCookies.isEmpty()) return null;
    return sessionRepository.findUserId(sessionCookies);
  };
