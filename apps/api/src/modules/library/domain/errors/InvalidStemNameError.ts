import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidStemNameError extends ValidationError {
  readonly code = "stem.invalid_name";

  constructor(value: string) {
    super(`"${value}" is not a stem name`);
  }
}
