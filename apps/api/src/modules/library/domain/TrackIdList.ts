import { DuplicatedTrackIdError } from "./errors/DuplicatedTrackIdError.ts";
import { TrackId, type TrackIdPrimitive } from "./TrackId.ts";

export type TrackIdListPrimitive = readonly TrackIdPrimitive[];

export class TrackIdList {
  private readonly ids: readonly TrackId[];

  private constructor(ids: readonly TrackId[]) {
    this.ids = ids;
  }

  static create(ids: readonly TrackId[]): TrackIdList {
    TrackIdList.ensureHasNoDuplicates(ids);
    return new TrackIdList([...ids]);
  }

  static empty(): TrackIdList {
    return TrackIdList.create([]);
  }

  static fromPrimitive(data: TrackIdListPrimitive): TrackIdList {
    return TrackIdList.create(data.map(TrackId.fromPrimitive));
  }

  private static ensureHasNoDuplicates(ids: readonly TrackId[]): void {
    const values = ids.map((id) => id.toPrimitive());
    const duplicated = values.find((value, index) => values.indexOf(value) !== index);
    if (duplicated) throw new DuplicatedTrackIdError(duplicated);
  }

  includes(id: TrackId): boolean {
    return this.ids.some((candidate) => candidate.equals(id));
  }

  isEmpty(): boolean {
    return this.ids.length === 0;
  }

  equals(other: TrackIdList): boolean {
    return this.ids.length === other.ids.length && this.ids.every((id, index) => other.ids[index]?.equals(id));
  }

  toPrimitive(): TrackIdListPrimitive {
    return this.ids.map((id) => id.toPrimitive());
  }
}
