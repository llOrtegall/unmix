import { InvalidPageCursorError } from "./errors/InvalidPageCursorError.ts";

export type PageCursorPrimitive = string;

export class PageCursor {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): PageCursor {
    PageCursor.ensureIsNotEmpty(value);
    return new PageCursor(value);
  }

  static fromPrimitive(data: PageCursorPrimitive): PageCursor {
    return PageCursor.create(data);
  }

  private static ensureIsNotEmpty(value: string): void {
    if (value.length === 0) throw new InvalidPageCursorError(value);
  }

  equals(other: PageCursor): boolean {
    return this.value === other.value;
  }

  toPrimitive(): PageCursorPrimitive {
    return this.value;
  }
}
