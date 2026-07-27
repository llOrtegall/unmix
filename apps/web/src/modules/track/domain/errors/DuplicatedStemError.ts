import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class DuplicatedStemError extends ValidationError {
  readonly code = "track.duplicated_stem";

  constructor(name: string) {
    super(`The ${name} stem appears more than once`);
  }
}
