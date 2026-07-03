import { describe, expect, it } from "vitest";
import { SeparationJob } from "../../src/modules/separation/domain/separation-job.ts";

const now = new Date();
const request = () =>
  SeparationJob.request({ id: "j1", eventId: "e1", trackId: "t1", inputKey: "in", outputPrefix: "out", model: "htdemucs_6s", now });
const result = { durationSeconds: 120, stems: [{ name: "drums" as const, key: "out/drums.flac", sizeBytes: 5, silent: false }] };

describe("SeparationJob", () => {
  it("records a separation.requested event", () => {
    const events = request().pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: "e1", type: "separation.requested", payload: { jobId: "j1", trackId: "t1" } });
  });

  it("moves to processing on progress and ignores repeated values", () => {
    const job = request();
    expect(job.recordProgress("separating", 40)).toBe(true);
    expect(job.recordProgress("separating", 40)).toBe(false);
    expect(job.toSnapshot()).toMatchObject({ status: "processing", stage: "separating", progress: 40 });
  });

  it("completes once and emits one event", () => {
    const job = request();
    job.pullEvents();
    expect(job.complete(result, "e2", now)._unsafeUnwrap()).toBe(true);
    expect(job.complete(result, "e3", now)._unsafeUnwrap()).toBe(false);
    expect(job.pullEvents().map((e) => e.type)).toEqual(["separation.completed"]);
    expect(job.recordProgress("separating", 10)).toBe(false);
  });

  it("rejects contradictory outcomes", () => {
    const done = request();
    done.complete(result, "e2", now);
    expect(done.fail({ code: "X", message: "x" }, "e3", now)._unsafeUnwrapErr().code).toBe("INVALID_TRANSITION");

    const failed = request();
    failed.fail({ code: "INVALID_MEDIA", message: "bad" }, "e2", now);
    expect(failed.complete(result, "e3", now).isErr()).toBe(true);
  });
});
