import type { SessionRepository } from "../domain/SessionRepository.ts";
import type { User } from "../domain/User.ts";

export const findCurrentUser =
  ({ sessionRepository }: { sessionRepository: SessionRepository }) =>
  (): Promise<User | null> =>
    sessionRepository.findCurrentUser();
