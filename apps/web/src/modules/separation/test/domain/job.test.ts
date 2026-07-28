import { describe, expect, it } from "vitest";
import { InvalidJobFailureError } from "../../domain/errors/InvalidJobFailureError.ts";
import { InvalidJobIdError } from "../../domain/errors/InvalidJobIdError.ts";
import { InvalidJobStatusError } from "../../domain/errors/InvalidJobStatusError.ts";
import { InvalidProgressError } from "../../domain/errors/InvalidProgressError.ts";
import { InvalidStageError } from "../../domain/errors/InvalidStageError.ts";
import { Job } from "../../domain/Job.ts";
import { JobFailure } from "../../domain/JobFailure.ts";
import { JobId } from "../../domain/JobId.ts";
import { JobStatus } from "../../domain/JobStatus.ts";
import { Progress } from "../../domain/Progress.ts";
import { Stage } from "../../domain/Stage.ts";
import * as JobMother from "../helpers/JobMother.ts";

describe("Job", () => {
  describe("Basic behaviour", () => {
    it("survives a primitive round-trip", () => {
      const primitive = JobMother.createPrimitive({ status: "failed", failure: { code: "separation.failed", message: "boom" } });

      expect(Job.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
    });

    it("shows its stage only while processing", () => {
      expect(JobMother.create({ stage: "uploading" }).activeStage()?.toPrimitive()).toBe("uploading");
      expect(JobMother.queued().activeStage()).toBeNull();
      expect(JobMother.completed().activeStage()).toBeNull();
    });

    it("is finished once completed or failed", () => {
      expect(JobMother.completed().isFinished()).toBe(true);
      expect(JobMother.completed().isCompleted()).toBe(true);
      expect(JobMother.failed().isFinished()).toBe(true);
      expect(JobMother.failed().hasFailed()).toBe(true);
      expect(JobMother.create().isFinished()).toBe(false);
    });

    it("compares by id", () => {
      const job = JobMother.create();

      expect(job.equals(Job.fromPrimitive({ ...job.toPrimitive(), progress: 99 }))).toBe(true);
      expect(job.equals(JobMother.create())).toBe(false);
    });

    it("compares value objects by value", () => {
      expect(Progress.create(5).equals(Progress.create(5))).toBe(true);
      expect(Stage.create("normalizing").equals(Stage.create("uploading"))).toBe(false);
      expect(JobStatus.create("queued").equals(JobStatus.create("queued"))).toBe(true);
      expect(JobFailure.create("separation.failed", "a").equals(JobFailure.create("separation.failed", "b"))).toBe(false);
    });
  });

  describe("JobFailure", () => {
    it.each(["separation.duration_exceeded", "separation.invalid_media"])("cannot be retried after %s", (code) => {
      expect(JobFailure.create(code, "").canBeRetried()).toBe(false);
    });

    it.each(["separation.failed", "separation.input_not_found", "separation.no_stems"])("can be retried after %s", (code) => {
      expect(JobFailure.create(code, "").canBeRetried()).toBe(true);
    });
  });

  describe("Error scenarios", () => {
    it.each([
      ["job id", () => JobId.create("job-1"), InvalidJobIdError],
      ["status", () => JobStatus.create("paused"), InvalidJobStatusError],
      ["stage", () => Stage.create("mastering"), InvalidStageError],
      ["progress above 100", () => Progress.create(101), InvalidProgressError],
      ["fractional progress", () => Progress.create(4.5), InvalidProgressError],
      ["failure code from another context", () => JobFailure.create("track.not_found", "x"), InvalidJobFailureError],
      ["empty failure code", () => JobFailure.create("separation.", "x"), InvalidJobFailureError],
      ["failed job without a failure", () => JobMother.create({ status: "failed" }), InvalidJobFailureError],
      ["running job with a failure", () => JobMother.create({ failure: { code: "separation.failed", message: "x" } }), InvalidJobFailureError],
    ])("rejects an invalid %s", (_, build, error) => {
      expect(build).toThrow(error);
    });
  });
});
