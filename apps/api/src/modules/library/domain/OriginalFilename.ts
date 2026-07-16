import { InvalidOriginalFilenameError } from "./errors/InvalidOriginalFilenameError.ts";

export type OriginalFilenamePrimitive = string;

export class OriginalFilename {
  private static readonly MAX_LENGTH = 255;
  private static readonly EXTENSION = /\.[^.]+$/;

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): OriginalFilename {
    OriginalFilename.ensureIsNotBlank(value);
    OriginalFilename.ensureDoesNotExceedMaxLength(value);
    return new OriginalFilename(value);
  }

  static fromPrimitive(data: OriginalFilenamePrimitive): OriginalFilename {
    return OriginalFilename.create(data);
  }

  private static ensureIsNotBlank(value: string): void {
    if (value.trim().length === 0) throw new InvalidOriginalFilenameError("it is empty");
  }

  private static ensureDoesNotExceedMaxLength(value: string): void {
    if (value.length > OriginalFilename.MAX_LENGTH) {
      throw new InvalidOriginalFilenameError(`it exceeds ${OriginalFilename.MAX_LENGTH} characters`);
    }
  }

  withoutExtension(): string {
    return this.value.replace(OriginalFilename.EXTENSION, "").trim();
  }

  equals(other: OriginalFilename): boolean {
    return this.value === other.value;
  }

  toPrimitive(): OriginalFilenamePrimitive {
    return this.value;
  }
}
