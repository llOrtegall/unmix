import { InvalidJobStatusError } from "./errors/InvalidJobStatusError.ts";

const STATUSES = ["queued", "processing", "completed", "failed"] as const;

export type JobStatusPrimitive = (typeof STATUSES)[number];

export class JobStatus {
  private readonly value: JobStatusPrimitive;

  private constructor(value: JobStatusPrimitive) {
    this.value = value;
  }

  static create(value: string): JobStatus {
    JobStatus.ensureIsKnown(value);
    return new JobStatus(value);
  }

  static fromPrimitive(data: JobStatusPrimitive): JobStatus {
    return JobStatus.create(data);
  }

  private static ensureIsKnown(value: string): asserts value is JobStatusPrimitive {
    if (!STATUSES.includes(value as JobStatusPrimitive)) throw new InvalidJobStatusError(value);
  }

  isProcessing(): boolean {
    return this.value === "processing";
  }

  isCompleted(): boolean {
    return this.value === "completed";
  }

  hasFailed(): boolean {
    return this.value === "failed";
  }

  isFinished(): boolean {
    return this.isCompleted() || this.hasFailed();
  }

  equals(other: JobStatus): boolean {
    return this.value === other.value;
  }

  toPrimitive(): JobStatusPrimitive {
    return this.value;
  }
}
