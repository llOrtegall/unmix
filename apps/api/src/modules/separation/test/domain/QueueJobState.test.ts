import { describe, expect, it } from "vitest";
import { InvalidQueueJobStateError } from "../../domain/errors/InvalidQueueJobStateError.ts";
import { JobFailure } from "../../domain/JobFailure.ts";
import { Progress } from "../../domain/Progress.ts";
import { QueueJobState, type QueueJobStatePrimitive } from "../../domain/QueueJobState.ts";
import { Stage } from "../../domain/Stage.ts";
import * as JobFailureMother from "../helpers/JobFailureMother.ts";
import * as SeparationJobMother from "../helpers/SeparationJobMother.ts";
import * as SeparationResultMother from "../helpers/SeparationResultMother.ts";

describe("QueueJobState", () => {
  describe("Basic behaviour", () => {
    it.each<QueueJobStatePrimitive>([
      { state: "pending" },
      { state: "active", stage: "separating", progress: 40 },
      { state: "completed", result: SeparationResultMother.createPrimitive() },
      { state: "failed", failure: JobFailureMother.createPrimitive() },
      { state: "missing" },
    ])("survives a primitive round-trip when $state", (primitive) => {
      expect(QueueJobState.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
    });

    it("records the progress of an active job", () => {
      const job = SeparationJobMother.queued();

      const applied = QueueJobState.active(Stage.create("normalizing"), Progress.create(12)).applyTo(job);

      expect(applied.toPrimitive()).toMatchObject({ status: "processing", stage: "normalizing", progress: 12 });
    });

    it("completes the job with the queue's result", () => {
      const result = SeparationResultMother.create();

      const applied = QueueJobState.completed(result).applyTo(SeparationJobMother.processing());

      expect(applied.toPrimitive().status).toBe("completed");
      expect(applied.getEvents().count()).toBe(1);
    });

    it("fails the job with the queue's failure", () => {
      const failure = JobFailureMother.create();

      const applied = QueueJobState.failed(failure).applyTo(SeparationJobMother.processing());

      expect(applied.toPrimitive()).toMatchObject({ status: "failed", failure: failure.toPrimitive() });
    });

    it("fails a processing job missing from the queue", () => {
      const applied = QueueJobState.missing().applyTo(SeparationJobMother.processing());

      expect(applied.toPrimitive().failure).toEqual(JobFailure.lostFromQueue().toPrimitive());
    });

    it("leaves the job alone while it waits", () => {
      const job = SeparationJobMother.queued();

      expect(QueueJobState.pending().applyTo(job)).toBe(job);
    });

    it("compares by state and details", () => {
      const result = SeparationResultMother.create();
      const failure = JobFailureMother.create();
      const active = (progress: number) => QueueJobState.active(Stage.create("separating"), Progress.create(progress));

      expect(QueueJobState.pending().equals(QueueJobState.pending())).toBe(true);
      expect(QueueJobState.pending().equals(QueueJobState.missing())).toBe(false);
      expect(active(40).equals(active(40))).toBe(true);
      expect(active(40).equals(active(41))).toBe(false);
      expect(QueueJobState.completed(result).equals(QueueJobState.completed(result))).toBe(true);
      expect(QueueJobState.failed(failure).equals(QueueJobState.failed(JobFailure.lostFromQueue()))).toBe(false);
    });
  });

  describe("Error scenarios", () => {
    it("rejects an unknown state", () => {
      expect(() => QueueJobState.fromPrimitive({ state: "paused" } as unknown as QueueJobStatePrimitive)).toThrow(
        InvalidQueueJobStateError,
      );
    });
  });
});
