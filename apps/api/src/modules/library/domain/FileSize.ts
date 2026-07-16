import { InvalidFileSizeError } from "./errors/InvalidFileSizeError.ts";

export type FileSizePrimitive = number;

export class FileSize {
  private static readonly BYTES_PER_MEGABYTE = 1_048_576;

  private readonly bytes: number;

  private constructor(bytes: number) {
    this.bytes = bytes;
  }

  static create(bytes: number): FileSize {
    FileSize.ensureIsAPositiveInteger(bytes);
    return new FileSize(bytes);
  }

  static fromPrimitive(data: FileSizePrimitive): FileSize {
    return FileSize.create(data);
  }

  private static ensureIsAPositiveInteger(bytes: number): void {
    if (!Number.isSafeInteger(bytes) || bytes <= 0) throw new InvalidFileSizeError(bytes);
  }

  isLargerThan(other: FileSize): boolean {
    return this.bytes > other.bytes;
  }

  toMegabytes(): number {
    return Math.round(this.bytes / FileSize.BYTES_PER_MEGABYTE);
  }

  equals(other: FileSize): boolean {
    return this.bytes === other.bytes;
  }

  toPrimitive(): FileSizePrimitive {
    return this.bytes;
  }
}
