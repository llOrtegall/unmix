import type { ObjectKey } from "../../shared/domain/ObjectKey.ts";
import { DuplicatedTrackIdError } from "./errors/DuplicatedTrackIdError.ts";
import { TrackFolder, type TrackFolderPrimitive } from "./TrackFolder.ts";
import { TrackIdList } from "./TrackIdList.ts";

export type TrackFolderListPrimitive = readonly TrackFolderPrimitive[];

export class TrackFolderList {
  private readonly folders: readonly TrackFolder[];

  private constructor(folders: readonly TrackFolder[]) {
    this.folders = folders;
  }

  static create(folders: readonly TrackFolder[]): TrackFolderList {
    TrackFolderList.ensureHasNoDuplicates(folders);
    return new TrackFolderList([...folders]);
  }

  static empty(): TrackFolderList {
    return TrackFolderList.create([]);
  }

  static fromKeys(keys: readonly ObjectKey[]): TrackFolderList {
    return TrackFolderList.create(keys.filter(TrackFolder.isTrackFolder).map(TrackFolder.fromKey));
  }

  static fromPrimitive(data: TrackFolderListPrimitive): TrackFolderList {
    return TrackFolderList.create(data.map(TrackFolder.fromPrimitive));
  }

  private static ensureHasNoDuplicates(folders: readonly TrackFolder[]): void {
    const keys = folders.map((folder) => folder.toPrimitive());
    const duplicated = keys.find((key, index) => keys.indexOf(key) !== index);
    if (duplicated) throw new DuplicatedTrackIdError(duplicated);
  }

  getTrackIds(): TrackIdList {
    return TrackIdList.create(this.folders.map((folder) => folder.getTrackId()));
  }

  excluding(trackIds: TrackIdList): TrackFolderList {
    return TrackFolderList.create(this.folders.filter((folder) => !trackIds.includes(folder.getTrackId())));
  }

  map<T>(transform: (folder: TrackFolder) => T): T[] {
    return this.folders.map(transform);
  }

  count(): number {
    return this.folders.length;
  }

  equals(other: TrackFolderList): boolean {
    return this.count() === other.count() && this.folders.every((folder, index) => other.folders[index]?.equals(folder));
  }

  toPrimitive(): TrackFolderListPrimitive {
    return this.folders.map((folder) => folder.toPrimitive());
  }
}
