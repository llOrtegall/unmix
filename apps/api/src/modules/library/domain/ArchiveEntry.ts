import { ObjectKey, type ObjectKeyPrimitive } from "../../shared/domain/ObjectKey.ts";
import { InvalidArchiveEntryError } from "./errors/InvalidArchiveEntryError.ts";

export interface ArchiveEntryPrimitive {
  readonly path: string;
  readonly key: ObjectKeyPrimitive;
}

export class ArchiveEntry {
  private readonly path: string;
  private readonly key: ObjectKey;

  private constructor(path: string, key: ObjectKey) {
    this.path = path;
    this.key = key;
  }

  static create(path: string, key: ObjectKey): ArchiveEntry {
    ArchiveEntry.ensurePathIsNotEmpty(path);
    ArchiveEntry.ensurePathStaysInsideTheArchive(path);
    return new ArchiveEntry(path, key);
  }

  static fromPrimitive(data: ArchiveEntryPrimitive): ArchiveEntry {
    return ArchiveEntry.create(data.path, ObjectKey.fromPrimitive(data.key));
  }

  private static ensurePathIsNotEmpty(path: string): void {
    if (path.trim().length === 0) throw new InvalidArchiveEntryError("the path is empty");
  }

  private static ensurePathStaysInsideTheArchive(path: string): void {
    if (path.startsWith("/") || path.split("/").includes("..")) {
      throw new InvalidArchiveEntryError(`"${path}" points outside the archive`);
    }
  }

  getPath(): string {
    return this.path;
  }

  getKey(): ObjectKey {
    return this.key;
  }

  equals(other: ArchiveEntry): boolean {
    return this.path === other.path && this.key.equals(other.key);
  }

  toPrimitive(): ArchiveEntryPrimitive {
    return { path: this.path, key: this.key.toPrimitive() };
  }
}
