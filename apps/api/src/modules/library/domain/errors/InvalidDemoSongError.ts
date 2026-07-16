import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidDemoSongError extends ValidationError {
  readonly code = "demo.invalid";

  constructor(reason: string) {
    super(`Invalid demo song: ${reason}`);
  }
}
