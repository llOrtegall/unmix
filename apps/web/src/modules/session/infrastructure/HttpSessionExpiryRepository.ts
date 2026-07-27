import type { Unsubscribe } from "../../shared/domain/Unsubscribe.ts";
import { onSessionExpired } from "../../shared/infrastructure/http.ts";
import type { SessionExpiryRepository } from "../domain/SessionExpiryRepository.ts";

export class HttpSessionExpiryRepository implements SessionExpiryRepository {
  watch(listener: () => void): Unsubscribe {
    return onSessionExpired(listener);
  }
}
