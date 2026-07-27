import { type Mocked, vi } from "vitest";
import type { JobRepository } from "../../domain/JobRepository.ts";
import * as JobMother from "./JobMother.ts";

export const create = (overrides: Partial<JobRepository> = {}): Mocked<JobRepository> =>
  ({
    findById: vi.fn().mockResolvedValue(null),
    request: vi.fn().mockResolvedValue(JobMother.queued()),
    ...overrides,
  }) as Mocked<JobRepository>;
