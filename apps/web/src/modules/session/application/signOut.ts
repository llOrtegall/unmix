import type { SessionRepository } from "../domain/SessionRepository.ts";

export const signOut =
  ({ sessionRepository }: { sessionRepository: SessionRepository }) =>
  (): Promise<void> =>
    sessionRepository.signOut();
