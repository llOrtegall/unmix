import { describe, expect, it } from "vitest";
import { JobLifecycle } from "../../src/modules/separation/application/use-cases/job-lifecycle.ts";
import { ReconcileJobs } from "../../src/modules/separation/application/use-cases/reconcile-jobs.ts";
import { RequestSeparation } from "../../src/modules/separation/application/use-cases/request-separation.ts";
import type { QueueJobState } from "../../src/modules/separation/application/ports/index.ts";
import { catalog, clock, InMemoryJobs, passthroughTx, RecordingPublisher, RecordingUpdates, sequentialIds } from "./fakes.ts";

function setup(ready = true) {
  const jobs = new InMemoryJobs();
  const events = new RecordingPublisher();
  const updates = new RecordingUpdates();
  const deps = { jobs, events, updates, tx: passthroughTx, ids: sequentialIds(), clock };
  return {
    jobs,
    events,
    updates,
    request: new RequestSeparation({ ...deps, catalog: catalog(ready), model: "htdemucs_6s" }),
    lifecycle: new JobLifecycle(deps),
  };
}

const result = { durationSeconds: 60, stems: [{ name: "vocals" as const, key: "k", sizeBytes: 1, silent: false }] };

describe("RequestSeparation", () => {
  it("creates a queued job and publishes separation.requested", async () => {
    const s = setup();
    const job = (await s.request.execute("t1"))._unsafeUnwrap();
    expect(job.status).toBe("queued");
    expect(s.events.events.map((e) => e.type)).toEqual(["separation.requested"]);
    expect(s.updates.published).toHaveLength(1);
  });

  it("passes catalog errors through without creating a job", async () => {
    const s = setup(false);
    expect((await s.request.execute("t1"))._unsafeUnwrapErr().code).toBe("UPLOAD_MISSING");
    expect(s.jobs.rows.size).toBe(0);
    expect(s.events.events).toHaveLength(0);
  });
});

describe("JobLifecycle", () => {
  it("is idempotent for duplicate completions", async () => {
    const s = setup();
    const job = (await s.request.execute("t1"))._unsafeUnwrap();
    await s.lifecycle.recordProgress(job.id, "separating", 50);
    await s.lifecycle.complete(job.id, result);
    await s.lifecycle.complete(job.id, result);
    expect(s.events.events.map((e) => e.type)).toEqual(["separation.requested", "separation.completed"]);
    expect(s.jobs.rows.get(job.id)?.status).toBe("completed");
  });

  it("ignores events for unknown jobs", async () => {
    const s = setup();
    await s.lifecycle.recordProgress("nope", "separating", 10);
    expect((await s.lifecycle.complete("nope", result)).isOk()).toBe(true);
    expect(s.events.events).toHaveLength(0);
  });
});

describe("ReconcileJobs", () => {
  it("applies outcomes that happened while the API was down", async () => {
    const s = setup();
    const a = (await s.request.execute("t1"))._unsafeUnwrap();
    const b = (await s.request.execute("t2"))._unsafeUnwrap();
    const states: Record<string, QueueJobState> = {
      [a.id]: { state: "completed", result },
      [b.id]: { state: "failed", failure: { code: "INVALID_MEDIA", message: "bad" } },
    };
    const reconcile = new ReconcileJobs({ jobs: s.jobs, lifecycle: s.lifecycle, queue: { inspect: async (id) => states[id]! } });

    expect(await reconcile.execute()).toEqual({ checked: 2 });
    expect(s.jobs.rows.get(a.id)?.status).toBe("completed");
    expect(s.jobs.rows.get(b.id)).toMatchObject({ status: "failed", failure: { code: "INVALID_MEDIA" } });
  });
});
