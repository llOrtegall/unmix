import { type Mocked, vi } from "vitest";
import type { JobEventsRepository } from "../../domain/JobEventsRepository.ts";

export const create = (overrides: Partial<JobEventsRepository> = {}): Mocked<JobEventsRepository> =>
  ({
    watch: vi.fn().mockReturnValue(vi.fn()),
    ...overrides,
  }) as Mocked<JobEventsRepository>;
