import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestFailedError } from "../../../shared/domain/errors/RequestFailedError.ts";
import { TrackId } from "../../../track/domain/TrackId.ts";
import { JobId } from "../../domain/JobId.ts";
import { EventSourceJobEventsRepository } from "../../infrastructure/EventSourceJobEventsRepository.ts";
import { HttpJobRepository } from "../../infrastructure/HttpJobRepository.ts";
import * as JobMother from "../helpers/JobMother.ts";

const BASE = "/api/v1";

const toResponse = (overrides = {}) => {
  const { id, failure, ...job } = JobMother.createPrimitive(overrides);
  return { jobId: id, error: failure, ...job };
};

class FakeEventSource {
  static readonly CLOSED = 2;
  static last: FakeEventSource;
  readonly listeners = new Map<string, (event: MessageEvent<string>) => void>();
  readyState = 1;
  onerror?: () => void;
  readonly url: string;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.last = this;
  }

  addEventListener(name: string, handler: (event: MessageEvent<string>) => void) {
    this.listeners.set(name, handler);
  }

  close() {
    this.readyState = FakeEventSource.CLOSED;
  }

  emit(name: string, data: unknown) {
    this.listeners.get(name)?.({ data: JSON.stringify(data) } as MessageEvent<string>);
  }
}

describe("HttpJobRepository", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("maps a job and finds nothing for an unknown one", async () => {
    const response = toResponse({ failure: { code: "separation.invalid_media", message: "bad" }, status: "failed" });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response)))
        .mockResolvedValueOnce(new Response(null, { status: 404 })),
    );
    const repository = new HttpJobRepository(BASE);

    const job = await repository.findById(JobId.create(response.jobId));

    expect(job?.getFailure()?.getCode()).toBe("separation.invalid_media");
    expect(await repository.findById(JobId.create(faker.string.uuid()))).toBeNull();
  });

  it("requests a separation for a track", async () => {
    const response = toResponse({ status: "queued", stage: null, progress: 0 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 201 })));

    const job = await new HttpJobRepository(BASE).request(TrackId.create(response.trackId));

    expect(job.getId().toPrimitive()).toBe(response.jobId);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(`${BASE}/tracks/${response.trackId}/jobs`, expect.objectContaining({ method: "POST" }));
  });
});

describe("EventSourceJobEventsRepository", () => {
  const id = JobId.create(faker.string.uuid());
  const watch = () => {
    const listener = { onUpdate: vi.fn(), onError: vi.fn() };
    const stop = new EventSourceJobEventsRepository(BASE).watch(id, listener);
    return { listener, stop, source: FakeEventSource.last };
  };

  beforeEach(() => vi.stubGlobal("EventSource", FakeEventSource));
  afterEach(() => vi.unstubAllGlobals());

  it("follows the job's stream until it finishes", () => {
    const { listener, source } = watch();

    source.emit("progress", toResponse({ progress: 42 }));
    source.emit("completed", toResponse({ status: "completed", progress: 100 }));

    expect(source.url).toBe(`${BASE}/jobs/${id.toPrimitive()}/events`);
    expect(listener.onUpdate.mock.calls.map(([job]) => job.getProgress().toPrimitive())).toEqual([42, 100]);
    expect(source.readyState).toBe(FakeEventSource.CLOSED);
  });

  it("closes the stream when unsubscribed", () => {
    const { stop, source } = watch();

    stop();

    expect(source.readyState).toBe(FakeEventSource.CLOSED);
  });

  it("reports a stream lost before the job finished", () => {
    const { listener, source } = watch();

    source.readyState = FakeEventSource.CLOSED;
    source.onerror?.();

    expect(listener.onError).toHaveBeenCalledWith(expect.any(RequestFailedError));
  });

  it("ignores the close that follows a finished job", () => {
    const { listener, source } = watch();

    source.emit("failed", toResponse({ status: "failed", failure: { code: "separation.failed", message: "x" } }));
    source.onerror?.();

    expect(listener.onError).not.toHaveBeenCalled();
  });

  it("reports an event that breaks the job's rules", () => {
    const { listener, source } = watch();

    source.emit("progress", toResponse({ progress: 140 }));

    expect(listener.onError).toHaveBeenCalledWith(expect.objectContaining({ code: "job.invalid_progress" }));
    expect(listener.onUpdate).not.toHaveBeenCalled();
  });
});
