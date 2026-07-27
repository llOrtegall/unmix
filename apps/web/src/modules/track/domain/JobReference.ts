import { InvalidJobReferenceError } from "./errors/InvalidJobReferenceError.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type JobReferencePrimitive = string;

export class JobReference {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): JobReference {
    JobReference.ensureIsUuid(value);
    return new JobReference(value);
  }

  static fromPrimitive(data: JobReferencePrimitive): JobReference {
    return JobReference.create(data);
  }

  private static ensureIsUuid(value: string): void {
    if (!UUID.test(value)) throw new InvalidJobReferenceError(value);
  }

  equals(other: JobReference): boolean {
    return this.value === other.value;
  }

  toPrimitive(): JobReferencePrimitive {
    return this.value;
  }
}
