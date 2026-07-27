import { DomainError } from "../../../shared/domain/DomainError.ts";

export class PlaybackLoadFailedError extends DomainError {
  readonly code = "mixer.load_failed";

  constructor(name: string) {
    super(`Could not load the ${name} stem`);
  }
}
