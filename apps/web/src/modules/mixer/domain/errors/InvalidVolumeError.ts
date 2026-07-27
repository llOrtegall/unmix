import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidVolumeError extends ValidationError {
  readonly code = "mixer.invalid_volume";

  constructor(value: number) {
    super(`${value} is not a volume between 0 and 1`);
  }
}
