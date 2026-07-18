import { describe, expect, it, vi } from "vitest";
import { InMemoryJobUpdatesRepository } from "../../infrastructure/InMemoryJobUpdatesRepository.ts";
import * as SeparationJobMother from "../helpers/SeparationJobMother.ts";

describe("InMemoryJobUpdatesRepository", () => {
  it("delivers a job's changes only to its own listeners", () => {
    const repository = new InMemoryJobUpdatesRepository();
    const job = SeparationJobMother.processing();
    const listener = vi.fn();
    const otherListener = vi.fn();
    repository.subscribe(job.getId(), listener);
    repository.subscribe(SeparationJobMother.queued().getId(), otherListener);

    repository.publish(job);

    expect(listener).toHaveBeenCalledWith(job);
    expect(otherListener).not.toHaveBeenCalled();
  });

  it("stops delivering once unsubscribed", () => {
    const repository = new InMemoryJobUpdatesRepository();
    const job = SeparationJobMother.processing();
    const listener = vi.fn();

    repository.subscribe(job.getId(), listener)();
    repository.publish(job);

    expect(listener).not.toHaveBeenCalled();
  });
});
