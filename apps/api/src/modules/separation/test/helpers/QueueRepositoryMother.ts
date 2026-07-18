import { type Mocked, vi } from "vitest";
import { QueueJobState } from "../../domain/QueueJobState.ts";
import type { QueueRepository } from "../../domain/QueueRepository.ts";

export const create = (overrides: Partial<QueueRepository> = {}): Mocked<QueueRepository> =>
  ({
    findState: vi.fn().mockResolvedValue(QueueJobState.pending()),
    ...overrides,
  }) as Mocked<QueueRepository>;
