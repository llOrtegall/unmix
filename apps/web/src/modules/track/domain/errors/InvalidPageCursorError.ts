import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidPageCursorError extends ValidationError {
  readonly code = "track.invalid_cursor";

  constructor(value: string) {
    super(`"${value}" is not a page cursor`);
  }
}
