import { UserId } from "../../shared/domain/UserId.ts";
import type { DemoSongRepository } from "../domain/DemoSongRepository.ts";
import { Track } from "../domain/Track.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";

interface Dependencies {
  readonly trackRepository: TrackRepository;
  readonly demoSongRepository: DemoSongRepository;
}

export const addDemoTrack =
  ({ trackRepository, demoSongRepository }: Dependencies) =>
  async (ownerId: string): Promise<Track | null> => {
    const demo = await demoSongRepository.find();
    if (!demo) return null;

    const track = Track.fromDemo(UserId.fromPrimitive(ownerId), demo);
    await trackRepository.save(track);
    return track;
  };
