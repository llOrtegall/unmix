import { type Mocked, vi } from "vitest";
import { TrackIdList } from "../../domain/TrackIdList.ts";
import { TrackList } from "../../domain/TrackList.ts";
import { TrackPage } from "../../domain/TrackPage.ts";
import type { TrackRepository } from "../../domain/TrackRepository.ts";

export const create = (overrides: Partial<TrackRepository> = {}): Mocked<TrackRepository> =>
  ({
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    findPageByOwner: vi.fn().mockResolvedValue(TrackPage.lastPage(TrackList.empty())),
    findAwaitingUploadCreatedBefore: vi.fn().mockResolvedValue(TrackList.empty()),
    findExistingIds: vi.fn().mockResolvedValue(TrackIdList.empty()),
    ...overrides,
  }) as Mocked<TrackRepository>;
