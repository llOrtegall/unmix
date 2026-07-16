import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidFileSizeError extends ValidationError {
  readonly code = "track.invalid_size";

  constructor(bytes: number) {
    super(`${bytes} is not a valid file size`);
  }
}
