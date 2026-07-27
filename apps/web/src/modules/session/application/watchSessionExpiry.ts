import type { Unsubscribe } from "../../shared/domain/Unsubscribe.ts";
import type { SessionExpiryRepository } from "../domain/SessionExpiryRepository.ts";

export const watchSessionExpiry =
  ({ sessionExpiryRepository }: { sessionExpiryRepository: SessionExpiryRepository }) =>
  (listener: () => void): Unsubscribe =>
    sessionExpiryRepository.watch(listener);
