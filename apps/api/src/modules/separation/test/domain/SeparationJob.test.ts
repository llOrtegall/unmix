import { afterEach, describe, expect, it, vi } from "vitest";
import { InvalidJobTransitionError } from "../../domain/errors/InvalidJobTransitionError.ts";
import { InvalidSeparationJobError } from "../../domain/errors/InvalidSeparationJobError.ts";
import { JobFailure } from "../../domain/JobFailure.ts";
import { ModelName } from "../../domain/ModelName.ts";
import { Progress } from "../../domain/Progress.ts";
import { SeparationCompleted } from "../../domain/SeparationCompleted.ts";
import { SeparationFailed } from "../../domain/SeparationFailed.ts";
import { SeparationJob } from "../../domain/SeparationJob.ts";
import { SeparationRequested } from "../../domain/SeparationRequested.ts";
import { Stage } from "../../domain/Stage.ts";
import * as TrackMother from "../../../library/test/helpers/TrackMother.ts";
import * as JobFailureMother from "../helpers/JobFailureMother.ts";
import * as SeparationJobMother from "../helpers/SeparationJobMother.ts";
import * as SeparationResultMother from "../helpers/SeparationResultMother.ts";

const NOW = "2026-07-01T12:00:00.000Z";

const freezeTime = () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
};

describe("SeparationJob", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic behaviour", () => {
    it("survives a primitive round-trip", () => {
      const primitive = SeparationJobMother.failed().toPrimitive();

      expect(SeparationJob.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
    });

    it("is requested queued for a track and records the request", () => {
      freezeTime();
      const track = TrackMother.create();

      const job = SeparationJob.request(track, ModelName.create("htdemucs_6s"));

      const { id, inputKey } = track.toPrimitive();
      expect(job.toPrimitive()).toMatchObject({
        trackId: id,
        model: "htdemucs_6s",
        status: "queued",
        stage: null,
        progress: 0,
        failure: null,
        createdAt: NOW,
        finishedAt: null,
      });
      expect(job.getEvents().toPrimitive()).toEqual([
        {
          id: expect.any(String),
          type: SeparationRequested.TYPE,
          occurredAt: NOW,
          payload: { jobId: job.getId().toPrimitive(), trackId: id, inputKey, outputPrefix: `tracks/${id}/stems`, model: "htdemucs_6s" },
        },
      ]);
    });

    it("moves to processing when progress is recorded and leaves the original untouched", () => {
      const job = SeparationJobMother.queued();

      const progressed = job.recordProgress(Stage.create("separating"), Progress.create(40));

      expect(progressed.toPrimitive()).toMatchObject({ status: "processing", stage: "separating", progress: 40 });
      expect(job.toPrimitive()).toMatchObject({ status: "queued", stage: null, progress: 0 });
      expect(progressed.getEvents().isEmpty()).toBe(true);
    });

    it("completes with the full progress and records the result", () => {
      freezeTime();
      const job = SeparationJobMother.processing();
      const result = SeparationResultMother.create();

      const completed = job.complete(result);

      expect(completed.toPrimitive()).toMatchObject({ status: "completed", stage: "uploading", progress: 100, finishedAt: NOW });
      expect(completed.getEvents().map((event) => event.toPrimitive())).toEqual([
        expect.objectContaining({
          type: SeparationCompleted.TYPE,
          payload: { jobId: job.getId().toPrimitive(), trackId: job.getTrackId().toPrimitive(), ...result.toPrimitive() },
        }),
      ]);
      expect(job.isFinished()).toBe(false);
    });

    it("fails with the failure and records it", () => {
      freezeTime();
      const job = SeparationJobMother.processing();
      const failure = JobFailureMother.create();

      const failed = job.fail(failure);

      expect(failed.toPrimitive()).toMatchObject({ status: "failed", failure: failure.toPrimitive(), finishedAt: NOW });
      expect(failed.getEvents().map((event) => event.toPrimitive())).toEqual([
        expect.objectContaining({
          type: SeparationFailed.TYPE,
          payload: { jobId: job.getId().toPrimitive(), trackId: job.getTrackId().toPrimitive(), ...failure.toPrimitive() },
        }),
      ]);
    });

    it("fails a processing job that the queue lost", () => {
      const lost = SeparationJobMother.processing().markAsLost();

      expect(lost.toPrimitive()).toMatchObject({ status: "failed", failure: JobFailure.lostFromQueue().toPrimitive() });
    });

    it("compares by id", () => {
      const job = SeparationJobMother.queued();

      expect(job.equals(job.recordProgress(Stage.create("downloading"), Progress.none()))).toBe(true);
      expect(job.equals(SeparationJobMother.queued())).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("ignores progress after the job finished", () => {
      const job = SeparationJobMother.completed();

      expect(job.recordProgress(Stage.create("separating"), Progress.create(10))).toBe(job);
    });

    it("ignores a repeated completion or failure", () => {
      const completed = SeparationJobMother.completed();
      const failed = SeparationJobMother.failed();

      expect(completed.complete(SeparationResultMother.create())).toBe(completed);
      expect(failed.fail(JobFailureMother.create())).toBe(failed);
    });

    it("keeps waiting for a queued job that is not in the queue yet", () => {
      const job = SeparationJobMother.queued();

      expect(job.markAsLost()).toBe(job);
    });
  });

  describe("Error scenarios", () => {
    it("cannot complete a failed job", () => {
      expect(() => SeparationJobMother.failed().complete(SeparationResultMother.create())).toThrow(InvalidJobTransitionError);
    });

    it("cannot fail a completed job", () => {
      expect(() => SeparationJobMother.completed().fail(JobFailureMother.create())).toThrow(InvalidJobTransitionError);
    });

    it.each([
      ["a failed job without a failure", { status: "failed", failure: null, finishedAt: NOW }],
      ["a failure on a job that did not fail", { status: "processing", stage: "separating", failure: JobFailureMother.createPrimitive() }],
      ["a finished job without a finish date", { status: "completed", stage: "uploading", progress: 100, finishedAt: null }],
      ["a finish date on a running job", { status: "queued", finishedAt: NOW }],
      ["a processing job without a stage", { status: "processing", stage: null }],
    ] as const)("rejects %s", (_case, overrides) => {
      expect(() => SeparationJobMother.create(overrides)).toThrow(InvalidSeparationJobError);
    });
  });
});
