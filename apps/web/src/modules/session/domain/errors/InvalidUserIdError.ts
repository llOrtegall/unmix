import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidUserIdError extends ValidationError {
  readonly code = "session.invalid_user_id";

  constructor() {
    super("The user id is empty");
  }
}
