import type { Unsubscribe } from "../../shared/domain/Unsubscribe.ts";

export interface SessionExpiryRepository {
  watch(listener: () => void): Unsubscribe;
}
