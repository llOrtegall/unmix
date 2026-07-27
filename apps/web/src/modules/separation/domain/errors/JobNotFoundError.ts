import { NotFoundError } from "../../../shared/domain/DomainError.ts";

export class JobNotFoundError extends NotFoundError {
  readonly code = "job.not_found";

  constructor(id: string) {
    super(`Job ${id} not found`);
  }
}
