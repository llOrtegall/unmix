import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ConflictError, DomainError, ForbiddenError, NotFoundError } from "../modules/shared/domain/DomainError.ts";
import { InvalidUserIdError } from "../modules/shared/domain/errors/InvalidUserIdError.ts";
import { errorHandler, notFoundHandler } from "./errorHandler.ts";

class MissingRecordError extends NotFoundError {
  readonly code = "record.not_found";
}

class BusyRecordError extends ConflictError {
  readonly code = "record.busy";
}

class LockedRecordError extends ForbiddenError {
  readonly code = "record.locked";
}

class UncategorizedError extends DomainError {
  readonly code = "record.uncategorized";
}

const appThrowing = (error: unknown) =>
  Fastify()
    .setErrorHandler(errorHandler)
    .setNotFoundHandler(notFoundHandler)
    .get("/failure", async () => {
      throw error;
    });

const requestFailure = (error: unknown) => appThrowing(error).inject({ method: "GET", url: "/failure" });

describe("errorHandler", () => {
  describe("Basic behaviour", () => {
    it.each([
      ["a validation error", new InvalidUserIdError("not-a-uuid"), 422, "user.invalid_id"],
      ["a not found error", new MissingRecordError("missing"), 404, "record.not_found"],
      ["a conflict error", new BusyRecordError("busy"), 409, "record.busy"],
      ["a forbidden error", new LockedRecordError("locked"), 403, "record.locked"],
    ])("maps %s to its category status and code", async (_name, error, status, code) => {
      const response = await requestFailure(error);

      expect(response.statusCode).toBe(status);
      expect(response.json()).toMatchObject({ code });
    });

    it("responds 400 when a request does not match its schema", async () => {
      const response = await requestFailure(z.object({ trackId: z.uuid() }).safeParse({ trackId: "x" }).error);

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ code: "request.invalid", message: expect.stringContaining("trackId") });
    });

    it("responds 404 with a code for unknown routes", async () => {
      const response = await appThrowing(null).inject({ method: "GET", url: "/nowhere" });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ code: "route.not_found" });
    });
  });

  describe("Edge cases", () => {
    it("keeps the status of framework client errors", async () => {
      const response = await requestFailure(Object.assign(new Error("Unsupported Media Type"), { statusCode: 415 }));

      expect(response.statusCode).toBe(415);
      expect(response.json()).toMatchObject({ code: "request.invalid" });
    });

    it("responds 500 for a domain error outside every category", async () => {
      const response = await requestFailure(new UncategorizedError("odd"));

      expect(response.statusCode).toBe(500);
      expect(response.json()).toMatchObject({ code: "record.uncategorized" });
    });
  });

  describe("Error scenarios", () => {
    it("hides the details of unexpected errors", async () => {
      const response = await requestFailure(new Error("connection refused at 10.0.0.3"));

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ code: "internal", message: expect.not.stringContaining("10.0.0.3") });
    });
  });
});
