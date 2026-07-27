import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidUploadProgressError extends ValidationError {
  readonly code = "upload.invalid_progress";

  constructor(fraction: number) {
    super(`${fraction} is not an upload fraction`);
  }
}
