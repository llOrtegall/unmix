import type { Clock, IdGenerator } from "../../../../shared/kernel/ports.ts";
import { Track } from "../../domain/track.ts";
import type { DemoLibrary, TrackRepository } from "../ports/index.ts";

/** Gives a new user the demo song, ready to play, so the library never starts empty. */
export class AddDemoTrack {
  #tracks: TrackRepository;
  #demo: DemoLibrary;
  #ids: IdGenerator;
  #clock: Clock;

  constructor(deps: { tracks: TrackRepository; demo: DemoLibrary; ids: IdGenerator; clock: Clock }) {
    this.#tracks = deps.tracks;
    this.#demo = deps.demo;
    this.#ids = deps.ids;
    this.#clock = deps.clock;
  }

  /** Returns false when no demo has been seeded yet. */
  async execute(ownerId: string): Promise<boolean> {
    const demo = await this.#demo.load();
    if (!demo) return false;
    await this.#tracks.save(Track.fromDemo({ id: this.#ids.next(), ownerId, demo, now: this.#clock.now() }));
    return true;
  }
}
