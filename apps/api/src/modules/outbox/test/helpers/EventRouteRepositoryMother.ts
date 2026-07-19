import { type Mocked, vi } from "vitest";
import type { EventRouteRepository } from "../../domain/EventRouteRepository.ts";

export const create = (overrides: Partial<EventRouteRepository> = {}): Mocked<EventRouteRepository> =>
  ({
    deliver: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as Mocked<EventRouteRepository>;
