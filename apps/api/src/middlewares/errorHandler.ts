import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../modules/shared/domain/DomainError.ts";

const STATUS_BY_CATEGORY = [
  [ValidationError, 422],
  [NotFoundError, 404],
  [ConflictError, 409],
  [ForbiddenError, 403],
] as const;

const INTERNAL_SERVER_ERROR = 500;
const BAD_REQUEST = 400;

const describeIssue = (error: ZodError): string => {
  const issue = error.issues[0];
  const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
  return `${where}${issue?.message ?? "Invalid request"}`;
};

const isClientError = (error: FastifyError): boolean =>
  error.statusCode !== undefined && error.statusCode < INTERNAL_SERVER_ERROR;

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  if (error instanceof ZodError) {
    return reply.status(BAD_REQUEST).send({ code: "request.invalid", message: describeIssue(error) });
  }
  if (error instanceof DomainError) {
    const [, status] = STATUS_BY_CATEGORY.find(([category]) => error instanceof category) ?? [DomainError, INTERNAL_SERVER_ERROR];
    return reply.status(status).send({ code: error.code, message: error.message });
  }
  if (isClientError(error)) {
    return reply.status(error.statusCode ?? BAD_REQUEST).send({ code: "request.invalid", message: error.message });
  }
  request.log.error({ err: error }, "unhandled error");
  return reply.status(INTERNAL_SERVER_ERROR).send({ code: "internal", message: "Something went wrong. Please try again." });
};

export const notFoundHandler = (_request: FastifyRequest, reply: FastifyReply) =>
  reply.status(404).send({ code: "route.not_found", message: "Route not found." });
