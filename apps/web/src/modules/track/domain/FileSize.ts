import { InvalidFileSizeError } from "./errors/InvalidFileSizeError.ts";

const BYTES_PER_MEGABYTE = 1_048_576;

export type FileSizePrimitive = number;

export class FileSize {
  private readonly bytes: number;

  private constructor(bytes: number) {
    this.bytes = bytes;
  }

  static create(bytes: number): FileSize {
    FileSize.ensureIsWholeAndNotNegative(bytes);
    return new FileSize(bytes);
  }

  static megabytes(megabytes: number): FileSize {
    return FileSize.create(megabytes * BYTES_PER_MEGABYTE);
  }

  static fromPrimitive(data: FileSizePrimitive): FileSize {
    return FileSize.create(data);
  }

  private static ensureIsWholeAndNotNegative(bytes: number): void {
    if (!Number.isInteger(bytes) || bytes < 0) throw new InvalidFileSizeError(bytes);
  }

  exceeds(limit: FileSize): boolean {
    return this.bytes > limit.bytes;
  }

  equals(other: FileSize): boolean {
    return this.bytes === other.bytes;
  }

  toPrimitive(): FileSizePrimitive {
    return this.bytes;
  }
}
