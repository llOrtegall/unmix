import { DuplicatedTrackIdError } from "./errors/DuplicatedTrackIdError.ts";
import { Track, type TrackPrimitive } from "./Track.ts";

export type TrackListPrimitive = readonly TrackPrimitive[];

export class TrackList {
  private readonly tracks: readonly Track[];

  private constructor(tracks: readonly Track[]) {
    this.tracks = tracks;
  }

  static create(tracks: readonly Track[]): TrackList {
    TrackList.ensureHasNoDuplicates(tracks);
    return new TrackList([...tracks]);
  }

  static empty(): TrackList {
    return TrackList.create([]);
  }

  static fromPrimitive(data: TrackListPrimitive): TrackList {
    return TrackList.create(data.map(Track.fromPrimitive));
  }

  private static ensureHasNoDuplicates(tracks: readonly Track[]): void {
    const ids = tracks.map((track) => track.getId().toPrimitive());
    const duplicated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicated) throw new DuplicatedTrackIdError(duplicated);
  }

  map<T>(transform: (track: Track) => T): T[] {
    return this.tracks.map(transform);
  }

  count(): number {
    return this.tracks.length;
  }

  isEmpty(): boolean {
    return this.tracks.length === 0;
  }

  equals(other: TrackList): boolean {
    return this.count() === other.count() && this.tracks.every((track, index) => other.tracks[index]?.equals(track));
  }

  toPrimitive(): TrackListPrimitive {
    return this.tracks.map((track) => track.toPrimitive());
  }
}
