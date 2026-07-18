import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class DuplicatedJobError extends ValidationError {
  readonly code = "job.duplicated";

  constructor(id: string) {
    super(`Job ${id} appears twice`);
  }
}
