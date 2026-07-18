import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidQueueJobStateError extends ValidationError {
  readonly code = "job.invalid_queue_state";

  constructor(value: string) {
    super(`"${value}" is not a queue job state`);
  }
}
