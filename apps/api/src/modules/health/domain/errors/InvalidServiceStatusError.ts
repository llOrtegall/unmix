import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidServiceStatusError extends ValidationError {
  readonly code = "health.invalid_status";

  constructor(value: string) {
    super(`"${value}" is not a service status`);
  }
}
