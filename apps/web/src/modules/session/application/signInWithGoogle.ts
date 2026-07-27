import type { SessionRepository } from "../domain/SessionRepository.ts";

export const signInWithGoogle =
  ({ sessionRepository }: { sessionRepository: SessionRepository }) =>
  (): Promise<void> =>
    sessionRepository.signInWithGoogle();
