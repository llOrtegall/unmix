import { InvalidCreatedAtError } from "./errors/InvalidCreatedAtError.ts";

export type CreatedAtPrimitive = string;

export class CreatedAt {
  private readonly value: Date;

  private constructor(value: Date) {
    this.value = value;
  }

  static create(value: string): CreatedAt {
    const date = new Date(value);
    CreatedAt.ensureIsValid(date, value);
    return new CreatedAt(date);
  }

  static fromPrimitive(data: CreatedAtPrimitive): CreatedAt {
    return CreatedAt.create(data);
  }

  private static ensureIsValid(date: Date, value: string): void {
    if (Number.isNaN(date.getTime())) throw new InvalidCreatedAtError(value);
  }

  toDate(): Date {
    return new Date(this.value);
  }

  equals(other: CreatedAt): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  toPrimitive(): CreatedAtPrimitive {
    return this.value.toISOString();
  }
}
