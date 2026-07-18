import { InvalidJobFailureError } from "./errors/InvalidJobFailureError.ts";

const CODES = [
  "INVALID_MESSAGE",
  "INPUT_NOT_FOUND",
  "INVALID_MEDIA",
  "DURATION_EXCEEDED",
  "SEPARATION_ERROR",
  "STORAGE_ERROR",
] as const;

export type JobFailureCodePrimitive = (typeof CODES)[number];

export interface JobFailurePrimitive {
  readonly code: JobFailureCodePrimitive;
  readonly message: string;
}

export class JobFailure {
  private static readonly UNEXPECTED_CODE: JobFailureCodePrimitive = "SEPARATION_ERROR";
  private static readonly UNKNOWN_REASON = "Unknown worker error.";

  private readonly code: JobFailureCodePrimitive;
  private readonly message: string;

  private constructor(code: JobFailureCodePrimitive, message: string) {
    this.code = code;
    this.message = message;
  }

  static create(code: string, message: string): JobFailure {
    JobFailure.ensureCodeIsKnown(code);
    JobFailure.ensureMessageIsNotEmpty(message);
    return new JobFailure(code, message.trim());
  }

  static unexpected(reason: string): JobFailure {
    return JobFailure.create(JobFailure.UNEXPECTED_CODE, reason.trim() || JobFailure.UNKNOWN_REASON);
  }

  static lostFromQueue(): JobFailure {
    return JobFailure.unexpected("Job lost from the queue.");
  }

  static invalidResult(): JobFailure {
    return JobFailure.unexpected("The worker returned an invalid result.");
  }

  static fromPrimitive(data: JobFailurePrimitive): JobFailure {
    return JobFailure.create(data.code, data.message);
  }

  private static ensureCodeIsKnown(code: string): asserts code is JobFailureCodePrimitive {
    if (!CODES.includes(code as JobFailureCodePrimitive)) throw new InvalidJobFailureError(`unknown code "${code}"`);
  }

  private static ensureMessageIsNotEmpty(message: string): void {
    if (message.trim().length === 0) throw new InvalidJobFailureError("the message is empty");
  }

  equals(other: JobFailure): boolean {
    return this.code === other.code && this.message === other.message;
  }

  toPrimitive(): JobFailurePrimitive {
    return { code: this.code, message: this.message };
  }
}
