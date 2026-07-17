import { InvalidCreatedAtError } from "./errors/InvalidCreatedAtError.ts";

export type CreatedAtPrimitive = string;

export class CreatedAt {
  private static readonly MILLISECONDS_PER_HOUR = 3_600_000;

  private readonly date: Date;

  private constructor(date: Date) {
    this.date = date;
  }

  static create(date: Date): CreatedAt {
    CreatedAt.ensureIsValid(date);
    return new CreatedAt(new Date(date));
  }

  static now(): CreatedAt {
    return CreatedAt.create(new Date());
  }

  static hoursAgo(hours: number): CreatedAt {
    return CreatedAt.create(new Date(Date.now() - hours * CreatedAt.MILLISECONDS_PER_HOUR));
  }

  static fromPrimitive(data: CreatedAtPrimitive): CreatedAt {
    return CreatedAt.create(new Date(data));
  }

  private static ensureIsValid(date: Date): void {
    if (Number.isNaN(date.getTime())) throw new InvalidCreatedAtError(String(date));
  }

  isBefore(other: CreatedAt): boolean {
    return this.date < other.date;
  }

  equals(other: CreatedAt): boolean {
    return this.date.getTime() === other.date.getTime();
  }

  toPrimitive(): CreatedAtPrimitive {
    return this.date.toISOString();
  }
}
