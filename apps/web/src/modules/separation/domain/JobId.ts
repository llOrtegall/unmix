import { InvalidJobIdError } from "./errors/InvalidJobIdError.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type JobIdPrimitive = string;

export class JobId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): JobId {
    JobId.ensureIsUuid(value);
    return new JobId(value);
  }

  static fromPrimitive(data: JobIdPrimitive): JobId {
    return JobId.create(data);
  }

  private static ensureIsUuid(value: string): void {
    if (!UUID.test(value)) throw new InvalidJobIdError(value);
  }

  equals(other: JobId): boolean {
    return this.value === other.value;
  }

  toPrimitive(): JobIdPrimitive {
    return this.value;
  }
}
