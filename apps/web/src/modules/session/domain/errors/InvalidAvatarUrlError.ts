import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidAvatarUrlError extends ValidationError {
  readonly code = "session.invalid_avatar_url";

  constructor(value: string) {
    super(`"${value}" is not a valid avatar URL`);
  }
}
