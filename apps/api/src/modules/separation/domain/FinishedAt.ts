import { InvalidFinishedAtError } from "./errors/InvalidFinishedAtError.ts";

export type FinishedAtPrimitive = string;

export class FinishedAt {
  private readonly date: Date;

  private constructor(date: Date) {
    this.date = date;
  }

  static create(date: Date): FinishedAt {
    FinishedAt.ensureIsValid(date);
    return new FinishedAt(new Date(date));
  }

  static now(): FinishedAt {
    return FinishedAt.create(new Date());
  }

  static fromPrimitive(data: FinishedAtPrimitive): FinishedAt {
    return FinishedAt.create(new Date(data));
  }

  private static ensureIsValid(date: Date): void {
    if (Number.isNaN(date.getTime())) throw new InvalidFinishedAtError(String(date));
  }

  equals(other: FinishedAt): boolean {
    return this.date.getTime() === other.date.getTime();
  }

  toPrimitive(): FinishedAtPrimitive {
    return this.date.toISOString();
  }
}
