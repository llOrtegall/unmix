import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidPublishedAtError extends ValidationError {
  readonly code = "outbox.invalid_published_at";

  constructor(value: string) {
    super(`"${value}" is not a valid date`);
  }
}
