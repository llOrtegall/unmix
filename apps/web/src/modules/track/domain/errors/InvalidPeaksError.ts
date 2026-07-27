import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidPeaksError extends ValidationError {
  readonly code = "track.invalid_peaks";

  constructor(reason: string) {
    super(`Invalid waveform peaks: ${reason}`);
  }
}
