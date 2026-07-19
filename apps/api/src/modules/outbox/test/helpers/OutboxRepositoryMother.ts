import { type Mocked, vi } from "vitest";
import { OutboxEventList } from "../../domain/OutboxEventList.ts";
import type { OutboxRepository } from "../../domain/OutboxRepository.ts";

export const create = (overrides: Partial<OutboxRepository> = {}): Mocked<OutboxRepository> =>
  ({
    findPending: vi.fn().mockResolvedValue(OutboxEventList.empty()),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as Mocked<OutboxRepository>;
