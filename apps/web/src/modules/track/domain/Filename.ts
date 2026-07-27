import { InvalidFilenameError } from "./errors/InvalidFilenameError.ts";

export type FilenamePrimitive = string;

export class Filename {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Filename {
    Filename.ensureIsNotEmpty(value);
    return new Filename(value);
  }

  static fromPrimitive(data: FilenamePrimitive): Filename {
    return Filename.create(data);
  }

  private static ensureIsNotEmpty(value: string): void {
    if (value.trim().length === 0) throw new InvalidFilenameError();
  }

  extension(): string {
    const dot = this.value.lastIndexOf(".");
    return dot === -1 ? "" : this.value.slice(dot + 1).toLowerCase();
  }

  equals(other: Filename): boolean {
    return this.value === other.value;
  }

  toPrimitive(): FilenamePrimitive {
    return this.value;
  }
}
