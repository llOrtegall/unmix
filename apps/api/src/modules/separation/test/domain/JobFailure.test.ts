import { describe, expect, it } from "vitest";
import { InvalidJobFailureError } from "../../domain/errors/InvalidJobFailureError.ts";
import { JobFailure } from "../../domain/JobFailure.ts";
import * as JobFailureMother from "../helpers/JobFailureMother.ts";

describe("JobFailure", () => {
  describe("Basic behaviour", () => {
    it("survives a primitive round-trip", () => {
      const primitive = JobFailureMother.createPrimitive();

      expect(JobFailure.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
    });

    it("trims the message", () => {
      expect(JobFailure.create("INVALID_MEDIA", "  bad file  ").toPrimitive().message).toBe("bad file");
    });

    it("describes unexpected failures with a generic code", () => {
      expect(JobFailure.unexpected("boom").toPrimitive()).toEqual({ code: "SEPARATION_ERROR", message: "boom" });
      expect(JobFailure.unexpected(" ").toPrimitive()).toEqual({ code: "SEPARATION_ERROR", message: "Unknown worker error." });
      expect(JobFailure.lostFromQueue().toPrimitive().code).toBe("SEPARATION_ERROR");
      expect(JobFailure.invalidResult().toPrimitive().code).toBe("SEPARATION_ERROR");
    });

    it("compares by code and message", () => {
      const primitive = JobFailureMother.createPrimitive();

      expect(JobFailure.fromPrimitive(primitive).equals(JobFailure.fromPrimitive(primitive))).toBe(true);
      expect(JobFailure.fromPrimitive(primitive).equals(JobFailure.lostFromQueue())).toBe(false);
    });
  });

  describe("Error scenarios", () => {
    it("rejects an unknown code", () => {
      expect(() => JobFailure.create("OUT_OF_COFFEE", "sorry")).toThrow(InvalidJobFailureError);
    });

    it("rejects an empty message", () => {
      expect(() => JobFailure.create("INVALID_MEDIA", "   ")).toThrow(InvalidJobFailureError);
    });
  });
});
