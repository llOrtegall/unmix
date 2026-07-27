import { InvalidJobFailureError } from "./errors/InvalidJobFailureError.ts";

const CODE_PREFIX = "separation.";
// A retry cannot change the length of a song or repair a file.
const FINAL_CODES: readonly string[] = ["separation.duration_exceeded", "separation.invalid_media"];

export interface JobFailurePrimitive {
  readonly code: string;
  readonly message: string;
}

export class JobFailure {
  private readonly code: string;
  private readonly message: string;

  private constructor(code: string, message: string) {
    this.code = code;
    this.message = message;
  }

  static create(code: string, message: string): JobFailure {
    JobFailure.ensureIsSeparationCode(code);
    return new JobFailure(code, message);
  }

  static fromPrimitive(data: JobFailurePrimitive): JobFailure {
    return JobFailure.create(data.code, data.message);
  }

  private static ensureIsSeparationCode(code: string): void {
    if (!code.startsWith(CODE_PREFIX) || code.length === CODE_PREFIX.length) {
      throw new InvalidJobFailureError(`"${code}" is not a separation failure code`);
    }
  }

  getCode(): string {
    return this.code;
  }

  canBeRetried(): boolean {
    return !FINAL_CODES.includes(this.code);
  }

  equals(other: JobFailure): boolean {
    return this.code === other.code && this.message === other.message;
  }

  toPrimitive(): JobFailurePrimitive {
    return { code: this.code, message: this.message };
  }
}
