import { ObjectKey, type ObjectKeyPrimitive } from "../../shared/domain/ObjectKey.ts";
import { InvalidTrackFolderError } from "./errors/InvalidTrackFolderError.ts";
import { TrackId } from "./TrackId.ts";

export type TrackFolderPrimitive = ObjectKeyPrimitive;

export class TrackFolder {
  private static readonly ROOT = "tracks/";
  private static readonly FORMAT = /^tracks\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/$/;

  private readonly trackId: TrackId;

  private constructor(trackId: TrackId) {
    this.trackId = trackId;
  }

  static create(trackId: TrackId): TrackFolder {
    return new TrackFolder(trackId);
  }

  static fromKey(key: ObjectKey): TrackFolder {
    return TrackFolder.create(TrackFolder.trackIdIn(key));
  }

  static fromPrimitive(data: TrackFolderPrimitive): TrackFolder {
    return TrackFolder.fromKey(ObjectKey.fromPrimitive(data));
  }

  static root(): ObjectKey {
    return ObjectKey.create(TrackFolder.ROOT);
  }

  static isTrackFolder(key: ObjectKey): boolean {
    return TrackFolder.FORMAT.test(key.toPrimitive());
  }

  private static trackIdIn(key: ObjectKey): TrackId {
    const id = TrackFolder.FORMAT.exec(key.toPrimitive())?.[1];
    if (!id) throw new InvalidTrackFolderError(key.toPrimitive());
    return TrackId.fromPrimitive(id);
  }

  getTrackId(): TrackId {
    return this.trackId;
  }

  getKey(): ObjectKey {
    return TrackFolder.root().child(`${this.trackId.toPrimitive()}/`);
  }

  child(name: string): ObjectKey {
    return this.getKey().child(name);
  }

  equals(other: TrackFolder): boolean {
    return this.trackId.equals(other.trackId);
  }

  toPrimitive(): TrackFolderPrimitive {
    return this.getKey().toPrimitive();
  }
}
