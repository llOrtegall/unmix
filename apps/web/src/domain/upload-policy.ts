import { err, ok, type Result } from "neverthrow";

export const ACCEPTED_TYPES: Record<string, string> = {
  "audio/mpeg": "MP3",
  "audio/wav": "WAV",
  "audio/x-wav": "WAV",
  "audio/flac": "FLAC",
  "audio/mp4": "M4A",
  "audio/x-m4a": "M4A",
  "audio/ogg": "OGG",
  "video/mp4": "MP4",
  "video/quicktime": "MOV",
  "video/webm": "WEBM",
  "video/x-matroska": "MKV",
};

const BY_EXTENSION: Record<string, string> = {
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

export const MAX_UPLOAD_MB = 200;

export type UploadRejection = { code: "UNSUPPORTED_MEDIA_TYPE"; type: string } | { code: "FILE_TOO_LARGE"; limitMb: number };

/** Browsers report some types inconsistently (e.g. empty for .mkv): fall back to the extension. */
export function resolveContentType(file: { name: string; type: string }): string {
  if (file.type && ACCEPTED_TYPES[file.type]) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXTENSION[ext] ?? file.type;
}

export function checkUpload(file: { name: string; type: string; size: number }): Result<string, UploadRejection> {
  const type = resolveContentType(file);
  if (!ACCEPTED_TYPES[type]) return err({ code: "UNSUPPORTED_MEDIA_TYPE", type: type || file.name });
  if (file.size > MAX_UPLOAD_MB * 1_048_576) return err({ code: "FILE_TOO_LARGE", limitMb: MAX_UPLOAD_MB });
  return ok(type);
}
