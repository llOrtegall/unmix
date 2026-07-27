import { type Mocked, vi } from "vitest";
import type { PlaybackRepository } from "../../domain/PlaybackRepository.ts";
import { Playhead } from "../../domain/Playhead.ts";

export const create = (overrides: Partial<PlaybackRepository> = {}): Mocked<PlaybackRepository> =>
  ({
    load: vi.fn().mockResolvedValue(undefined),
    unload: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    isPlaying: vi.fn().mockReturnValue(false),
    seek: vi.fn(),
    playhead: vi.fn().mockReturnValue(Playhead.start()),
    apply: vi.fn(),
    onEnded: vi.fn().mockReturnValue(vi.fn()),
    ...overrides,
  }) as Mocked<PlaybackRepository>;
