import { type Mocked, vi } from "vitest";
import type { EventRepository } from "../../domain/EventRepository.ts";

export const create = (overrides: Partial<EventRepository> = {}): Mocked<EventRepository> =>
  ({
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
    ...overrides,
  }) as Mocked<EventRepository>;
