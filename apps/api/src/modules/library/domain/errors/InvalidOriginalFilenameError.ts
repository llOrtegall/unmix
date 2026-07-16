import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidOriginalFilenameError extends ValidationError {
  readonly code = "track.invalid_filename";

  constructor(reason: string) {
    super(`Invalid filename: ${reason}`);
  }
}
