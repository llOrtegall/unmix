import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidSignedUrlError extends ValidationError {
  readonly code = "storage.invalid_signed_url";

  constructor(value: string) {
    super(`"${value}" is not a valid URL`);
  }
}
