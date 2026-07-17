import { InvalidOccurredAtError } from "./errors/InvalidOccurredAtError.ts";

export type OccurredAtPrimitive = string;

export class OccurredAt {
  private readonly date: Date;

  private constructor(date: Date) {
    this.date = date;
  }

  static create(date: Date): OccurredAt {
    OccurredAt.ensureIsValid(date);
    return new OccurredAt(new Date(date));
  }

  static now(): OccurredAt {
    return OccurredAt.create(new Date());
  }

  static fromPrimitive(data: OccurredAtPrimitive): OccurredAt {
    return OccurredAt.create(new Date(data));
  }

  private static ensureIsValid(date: Date): void {
    if (Number.isNaN(date.getTime())) throw new InvalidOccurredAtError(String(date));
  }

  equals(other: OccurredAt): boolean {
    return this.date.getTime() === other.date.getTime();
  }

  toPrimitive(): OccurredAtPrimitive {
    return this.date.toISOString();
  }
}
