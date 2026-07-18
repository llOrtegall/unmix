import { type Mocked, vi } from "vitest";
import type { JobUpdatesRepository } from "../../domain/JobUpdatesRepository.ts";

export const create = (overrides: Partial<JobUpdatesRepository> = {}): Mocked<JobUpdatesRepository> =>
  ({
    publish: vi.fn(),
    subscribe: vi.fn().mockReturnValue(vi.fn()),
    ...overrides,
  }) as Mocked<JobUpdatesRepository>;
