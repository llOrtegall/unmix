import { ValidationError } from "../DomainError.ts";

export class InvalidUserIdError extends ValidationError {
  readonly code = "user.invalid_id";

  constructor(value: string) {
    super(`"${value}" is not a valid user id`);
  }
}
