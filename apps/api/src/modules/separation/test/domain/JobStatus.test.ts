import { describe, expect, it } from "vitest";
import { InvalidJobStatusError } from "../../domain/errors/InvalidJobStatusError.ts";
import { JobStatus } from "../../domain/JobStatus.ts";

describe("JobStatus", () => {
  it("survives a primitive round-trip", () => {
    expect(JobStatus.fromPrimitive("processing").toPrimitive()).toBe("processing");
  });

  it("is finished only once completed or failed", () => {
    expect(JobStatus.queued().isFinished()).toBe(false);
    expect(JobStatus.processing().isFinished()).toBe(false);
    expect(JobStatus.completed().isFinished()).toBe(true);
    expect(JobStatus.failed().isFinished()).toBe(true);
  });

  it("answers what it is", () => {
    expect(JobStatus.processing().isProcessing()).toBe(true);
    expect(JobStatus.completed().isCompleted()).toBe(true);
    expect(JobStatus.failed().isFailed()).toBe(true);
    expect(JobStatus.queued().isProcessing()).toBe(false);
  });

  it("compares by value", () => {
    expect(JobStatus.queued().equals(JobStatus.create("queued"))).toBe(true);
    expect(JobStatus.queued().equals(JobStatus.failed())).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(() => JobStatus.create("paused")).toThrow(InvalidJobStatusError);
  });
});
