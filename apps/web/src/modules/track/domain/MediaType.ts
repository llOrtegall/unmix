import { UnsupportedMediaTypeError } from "./errors/UnsupportedMediaTypeError.ts";
import type { Filename } from "./Filename.ts";

const ACCEPTED = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
] as const;

// Browsers report some types inconsistently (e.g. empty for .mkv), so the extension decides then.
const BY_EXTENSION: Readonly<Record<string, MediaTypePrimitive>> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
};

export type MediaTypePrimitive = (typeof ACCEPTED)[number];

export class MediaType {
  private readonly value: MediaTypePrimitive;

  private constructor(value: MediaTypePrimitive) {
    this.value = value;
  }

  static create(value: string): MediaType {
    MediaType.ensureIsAccepted(value);
    return new MediaType(value);
  }

  static resolve(reported: string, filename: Filename): MediaType {
    if (MediaType.isAccepted(reported)) return MediaType.create(reported);
    return MediaType.create(BY_EXTENSION[filename.extension()] ?? (reported || filename.toPrimitive()));
  }

  static acceptedFormats(): string[] {
    return [...ACCEPTED, ...Object.keys(BY_EXTENSION).map((extension) => `.${extension}`)];
  }

  static fromPrimitive(data: MediaTypePrimitive): MediaType {
    return MediaType.create(data);
  }

  private static isAccepted(value: string): value is MediaTypePrimitive {
    return ACCEPTED.includes(value as MediaTypePrimitive);
  }

  private static ensureIsAccepted(value: string): asserts value is MediaTypePrimitive {
    if (!MediaType.isAccepted(value)) throw new UnsupportedMediaTypeError(value);
  }

  equals(other: MediaType): boolean {
    return this.value === other.value;
  }

  toPrimitive(): MediaTypePrimitive {
    return this.value;
  }
}
