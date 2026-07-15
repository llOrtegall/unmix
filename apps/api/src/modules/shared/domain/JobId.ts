import { InvalidJobIdError } from "./errors/InvalidJobIdError.ts";

export type JobIdPrimitive = string;

export class JobId {
  private static readonly UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): JobId {
    JobId.ensureIsUuid(value);
    return new JobId(value.toLowerCase());
  }

  static generate(): JobId {
    return JobId.create(crypto.randomUUID());
  }

  static fromPrimitive(data: JobIdPrimitive): JobId {
    return JobId.create(data);
  }

  private static ensureIsUuid(value: string): void {
    if (!JobId.UUID_FORMAT.test(value)) throw new InvalidJobIdError(value);
  }

  equals(other: JobId): boolean {
    return this.value === other.value;
  }

  toPrimitive(): JobIdPrimitive {
    return this.value;
  }
}
