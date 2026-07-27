import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidPlayheadError extends ValidationError {
  readonly code = "mixer.invalid_playhead";

  constructor(reason: string) {
    super(`Invalid playhead: ${reason}`);
  }
}
