import { type AppError, appError } from "../../../shared/kernel/errors.ts";

export type SeparationErrorCode = "JOB_NOT_FOUND" | "INVALID_TRANSITION";

export type SeparationError = AppError<SeparationErrorCode>;

export const separationError = (code: SeparationErrorCode, message: string): SeparationError =>
  appError(code, message);
