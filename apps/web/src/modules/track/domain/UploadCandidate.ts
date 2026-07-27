import { FileTooLargeError } from "./errors/FileTooLargeError.ts";
import { Filename, type FilenamePrimitive } from "./Filename.ts";
import { FileSize, type FileSizePrimitive } from "./FileSize.ts";
import { MediaType, type MediaTypePrimitive } from "./MediaType.ts";

export interface UploadCandidatePrimitive {
  readonly filename: FilenamePrimitive;
  readonly mediaType: MediaTypePrimitive;
  readonly sizeBytes: FileSizePrimitive;
}

export interface SelectedFile {
  readonly name: string;
  readonly type: string;
  readonly size: number;
}

export class UploadCandidate {
  static readonly MAX_MEGABYTES = 200;

  private readonly filename: Filename;
  private readonly mediaType: MediaType;
  private readonly size: FileSize;

  private constructor(filename: Filename, mediaType: MediaType, size: FileSize) {
    this.filename = filename;
    this.mediaType = mediaType;
    this.size = size;
  }

  static create(filename: Filename, mediaType: MediaType, size: FileSize): UploadCandidate {
    UploadCandidate.ensureFitsTheLimit(size);
    return new UploadCandidate(filename, mediaType, size);
  }

  static fromFile(file: SelectedFile): UploadCandidate {
    const filename = Filename.create(file.name);
    return UploadCandidate.create(filename, MediaType.resolve(file.type, filename), FileSize.create(file.size));
  }

  static fromPrimitive(data: UploadCandidatePrimitive): UploadCandidate {
    return UploadCandidate.create(
      Filename.fromPrimitive(data.filename),
      MediaType.fromPrimitive(data.mediaType),
      FileSize.fromPrimitive(data.sizeBytes),
    );
  }

  private static ensureFitsTheLimit(size: FileSize): void {
    if (size.exceeds(FileSize.megabytes(UploadCandidate.MAX_MEGABYTES))) throw new FileTooLargeError(UploadCandidate.MAX_MEGABYTES);
  }

  getMediaType(): MediaType {
    return this.mediaType;
  }

  equals(other: UploadCandidate): boolean {
    return this.filename.equals(other.filename) && this.mediaType.equals(other.mediaType) && this.size.equals(other.size);
  }

  toPrimitive(): UploadCandidatePrimitive {
    return { filename: this.filename.toPrimitive(), mediaType: this.mediaType.toPrimitive(), sizeBytes: this.size.toPrimitive() };
  }
}
