import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidStemNameError extends ValidationError {
  readonly code = "track.invalid_stem_name";

  constructor(value: string) {
    super(`"${value}" is not a known stem`);
  }
}
