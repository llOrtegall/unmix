import type { FastifyBaseLogger } from "fastify";
import { describe, expect, it, vi } from "vitest";
import type { SeparationModule } from "../modules/separation/application/factory.ts";
import { reconcileJobsJob } from "./reconcileJobsJob.ts";

describe("reconcileJobsJob", () => {
  it("reconciles the unfinished jobs and logs how many it checked", async () => {
    const reconcileJobs = vi.fn().mockResolvedValue({ checked: 3 });
    const log = { info: vi.fn() };

    await reconcileJobsJob({ reconcileJobs } as unknown as SeparationModule, log as unknown as FastifyBaseLogger);

    expect(log.info).toHaveBeenCalledWith({ checked: 3 }, "reconciled unfinished jobs");
  });
});
