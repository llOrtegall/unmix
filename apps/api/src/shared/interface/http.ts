import type { FastifyReply } from "fastify";
import type { AppError } from "../kernel/errors.ts";

const STATUS: Record<string, number> = {
  JOB_NOT_FOUND: 404,
  INVALID_TRANSITION: 409,
};

export function sendError(reply: FastifyReply, error: AppError) {
  return reply.status(STATUS[error.code] ?? 500).send({ code: error.code, message: error.message });
}
