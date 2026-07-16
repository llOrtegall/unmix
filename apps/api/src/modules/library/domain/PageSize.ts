import { InvalidPageSizeError } from "./errors/InvalidPageSizeError.ts";

export type PageSizePrimitive = number;

export class PageSize {
  private static readonly MAX = 50;

  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(value: number): PageSize {
    PageSize.ensureIsWithinRange(value);
    return new PageSize(value);
  }

  static fromPrimitive(data: PageSizePrimitive): PageSize {
    return PageSize.create(data);
  }

  private static ensureIsWithinRange(value: number): void {
    if (!Number.isInteger(value) || value < 1 || value > PageSize.MAX) throw new InvalidPageSizeError(value);
  }

  equals(other: PageSize): boolean {
    return this.value === other.value;
  }

  toPrimitive(): PageSizePrimitive {
    return this.value;
  }
}
