import { UnsupportedMediaTypeError } from "./errors/UnsupportedMediaTypeError.ts";

const EXTENSIONS = {
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/flac": ".flac",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/ogg": ".ogg",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/x-matroska": ".mkv",
} as const;

export type MediaTypePrimitive = keyof typeof EXTENSIONS;

export class MediaType {
  private readonly value: MediaTypePrimitive;

  private constructor(value: MediaTypePrimitive) {
    this.value = value;
  }

  static create(contentType: string): MediaType {
    const essence = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
    MediaType.ensureIsSupported(essence, contentType);
    return new MediaType(essence);
  }

  static fromPrimitive(data: MediaTypePrimitive): MediaType {
    return MediaType.create(data);
  }

  private static ensureIsSupported(essence: string, contentType: string): asserts essence is MediaTypePrimitive {
    if (!Object.hasOwn(EXTENSIONS, essence)) throw new UnsupportedMediaTypeError(contentType);
  }

  getExtension(): string {
    return EXTENSIONS[this.value];
  }

  equals(other: MediaType): boolean {
    return this.value === other.value;
  }

  toPrimitive(): MediaTypePrimitive {
    return this.value;
  }
}
