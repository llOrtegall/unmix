import { err, ok, type Result } from "../../../shared/kernel/result.ts";
import { type LibraryError, libraryError } from "./errors.ts";

const EXTENSIONS: Record<string, string> = {
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
};

export class MediaType {
  readonly value: string;
  readonly extension: string;

  private constructor(value: string, extension: string) {
    this.value = value;
    this.extension = extension;
  }

  static create(contentType: string): Result<MediaType, LibraryError> {
    const value = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
    const extension = EXTENSIONS[value];
    if (!extension) {
      return err(libraryError("UNSUPPORTED_MEDIA_TYPE", `Files of type ${contentType} are not supported.`));
    }
    return ok(new MediaType(value, extension));
  }

  static restore(value: string): MediaType {
    return new MediaType(value, EXTENSIONS[value] ?? "");
  }
}
