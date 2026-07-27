import { type Mocked, vi } from "vitest";
import type { PeaksRepository } from "../../domain/PeaksRepository.ts";
import { Waveforms } from "../../domain/Waveforms.ts";

export const create = (overrides: Partial<PeaksRepository> = {}): Mocked<PeaksRepository> =>
  ({
    findForStems: vi.fn().mockResolvedValue(Waveforms.empty()),
    ...overrides,
  }) as Mocked<PeaksRepository>;
