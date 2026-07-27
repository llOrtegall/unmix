import { DuplicatedTrackError } from "./errors/DuplicatedTrackError.ts";
import type { TrackId } from "./TrackId.ts";
import { TrackSummary, type TrackSummaryPrimitive } from "./TrackSummary.ts";

export type TrackListPrimitive = readonly TrackSummaryPrimitive[];

export class TrackList {
  private readonly tracks: readonly TrackSummary[];

  private constructor(tracks: readonly TrackSummary[]) {
    this.tracks = tracks;
  }

  static create(tracks: readonly TrackSummary[]): TrackList {
    TrackList.ensureHasNoDuplicates(tracks);
    return new TrackList([...tracks]);
  }

  static empty(): TrackList {
    return TrackList.create([]);
  }

  static fromPrimitive(data: TrackListPrimitive): TrackList {
    return TrackList.create(data.map(TrackSummary.fromPrimitive));
  }

  private static ensureHasNoDuplicates(tracks: readonly TrackSummary[]): void {
    const ids = tracks.map((track) => track.getId().toPrimitive());
    const duplicated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicated) throw new DuplicatedTrackError(duplicated);
  }

  hasSeparating(): boolean {
    return this.tracks.some((track) => track.isSeparating());
  }

  remove(id: TrackId): TrackList {
    return TrackList.create(this.tracks.filter((track) => !track.getId().equals(id)));
  }

  append(other: TrackList): TrackList {
    return TrackList.create([...this.tracks, ...other.tracks]);
  }

  map<T>(transform: (track: TrackSummary) => T): T[] {
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
