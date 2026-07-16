import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidCreatedAtError extends ValidationError {
  readonly code = "track.invalid_created_at";

  constructor(value: string) {
    super(`"${value}" is not a valid date`);
  }
}
