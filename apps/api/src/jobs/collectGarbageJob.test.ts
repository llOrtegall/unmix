import type { FastifyBaseLogger } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LibraryModule } from "../modules/library/application/factory.ts";
import { collectGarbageJob } from "./collectGarbageJob.ts";

const HOUR_MS = 3_600_000;

describe("collectGarbageJob", () => {
  const log = { info: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("collects garbage right away and then every hour", async () => {
    const report = { abandonedUploads: 1, orphanFolders: 2 };
    const collectGarbage = vi.fn().mockResolvedValue(report);

    const stop = collectGarbageJob({ collectGarbage } as unknown as LibraryModule, log as unknown as FastifyBaseLogger);
    await vi.advanceTimersByTimeAsync(HOUR_MS);
    stop();

    expect(collectGarbage).toHaveBeenCalledTimes(2);
    expect(log.info).toHaveBeenCalledWith(report, "garbage collected");
  });

  it("logs a failed collection", async () => {
    const collectGarbage = vi.fn().mockRejectedValue(new Error("storage down"));

    const stop = collectGarbageJob({ collectGarbage } as unknown as LibraryModule, log as unknown as FastifyBaseLogger);
    await vi.advanceTimersByTimeAsync(0);
    stop();

    expect(log.error).toHaveBeenCalledWith({ err: expect.any(Error) }, "garbage collection failed");
  });
});
