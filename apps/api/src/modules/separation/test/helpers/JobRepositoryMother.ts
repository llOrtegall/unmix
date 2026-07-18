import { type Mocked, vi } from "vitest";
import type { JobRepository } from "../../domain/JobRepository.ts";
import { SeparationJobList } from "../../domain/SeparationJobList.ts";

export const create = (overrides: Partial<JobRepository> = {}): Mocked<JobRepository> =>
  ({
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByIdForUpdate: vi.fn().mockResolvedValue(null),
    findUnfinished: vi.fn().mockResolvedValue(SeparationJobList.empty()),
    ...overrides,
  }) as Mocked<JobRepository>;
