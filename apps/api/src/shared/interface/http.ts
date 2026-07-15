import type { FastifyReply } from "fastify";
import type { AppError } from "../kernel/errors.ts";

const STATUS: Record<string, number> = {
  UNSUPPORTED_MEDIA_TYPE: 415,
  FILE_TOO_LARGE: 413,
  TRACK_NOT_FOUND: 404,
  JOB_NOT_FOUND: 404,
  UPLOAD_MISSING: 409,
  TRACK_BUSY: 409,
  INVALID_STATE: 409,
  INVALID_TRANSITION: 409,
};

export function sendError(reply: FastifyReply, error: AppError) {
  return reply.status(STATUS[error.code] ?? 500).send({ code: error.code, message: error.message });
}
