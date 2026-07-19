import { InvalidPublishedAtError } from "./errors/InvalidPublishedAtError.ts";

export type PublishedAtPrimitive = string;

export class PublishedAt {
  private readonly date: Date;

  private constructor(date: Date) {
    this.date = date;
  }

  static create(date: Date): PublishedAt {
    PublishedAt.ensureIsValid(date);
    return new PublishedAt(new Date(date));
  }

  static now(): PublishedAt {
    return PublishedAt.create(new Date());
  }

  static fromPrimitive(data: PublishedAtPrimitive): PublishedAt {
    return PublishedAt.create(new Date(data));
  }

  private static ensureIsValid(date: Date): void {
    if (Number.isNaN(date.getTime())) throw new InvalidPublishedAtError(String(date));
  }

  equals(other: PublishedAt): boolean {
    return this.date.getTime() === other.date.getTime();
  }

  toPrimitive(): PublishedAtPrimitive {
    return this.date.toISOString();
  }
}
