import { ValidationError } from "../DomainError.ts";

export class InvalidObjectKeyError extends ValidationError {
  readonly code = "storage.invalid_key";

  constructor(value: string, reason: string) {
    super(`"${value}" is not a valid object key: ${reason}`);
  }
}
