import type { FastifyReply } from "fastify";
import type { z } from "zod";
import type { AppError } from "../kernel/errors.ts";
import { err, ok, type Result } from "../kernel/result.ts";

const STATUS: Record<string, number> = {
  VALIDATION_ERROR: 400,
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
  return reply.status(STATUS[error.code] ?? 500).send({ error: { code: error.code, message: error.message } });
}

export function parse<S extends z.ZodType>(schema: S, value: unknown): Result<z.infer<S>, AppError> {
  const parsed = schema.safeParse(value);
  if (parsed.success) return ok(parsed.data);
  const issue = parsed.error.issues[0];
  const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
  return err({ code: "VALIDATION_ERROR", message: `${where}${issue?.message ?? "Invalid request"}` });
}
