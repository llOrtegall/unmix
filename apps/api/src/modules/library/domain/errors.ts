import { type AppError, appError } from "../../../shared/kernel/errors.ts";

export type LibraryErrorCode =
  | "TRACK_NOT_FOUND"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_MISSING"
  | "TRACK_BUSY"
  | "INVALID_STATE";

export type LibraryError = AppError<LibraryErrorCode>;

export const libraryError = (code: LibraryErrorCode, message: string): LibraryError =>
  appError(code, message);
