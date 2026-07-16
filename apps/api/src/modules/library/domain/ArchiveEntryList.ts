import { ArchiveEntry, type ArchiveEntryPrimitive } from "./ArchiveEntry.ts";
import { InvalidArchiveEntryError } from "./errors/InvalidArchiveEntryError.ts";

export type ArchiveEntryListPrimitive = readonly ArchiveEntryPrimitive[];

export class ArchiveEntryList {
  private readonly entries: readonly ArchiveEntry[];

  private constructor(entries: readonly ArchiveEntry[]) {
    this.entries = entries;
  }

  static create(entries: readonly ArchiveEntry[]): ArchiveEntryList {
    ArchiveEntryList.ensureHasNoDuplicatedPaths(entries);
    return new ArchiveEntryList([...entries]);
  }

  static fromPrimitive(data: ArchiveEntryListPrimitive): ArchiveEntryList {
    return ArchiveEntryList.create(data.map(ArchiveEntry.fromPrimitive));
  }

  private static ensureHasNoDuplicatedPaths(entries: readonly ArchiveEntry[]): void {
    const paths = entries.map((entry) => entry.getPath());
    const duplicated = paths.find((path, index) => paths.indexOf(path) !== index);
    if (duplicated) throw new InvalidArchiveEntryError(`"${duplicated}" appears more than once`);
  }

  map<T>(transform: (entry: ArchiveEntry) => T): T[] {
    return this.entries.map(transform);
  }

  count(): number {
    return this.entries.length;
  }

  equals(other: ArchiveEntryList): boolean {
    return this.count() === other.count() && this.entries.every((entry, index) => other.entries[index]?.equals(entry));
  }

  toPrimitive(): ArchiveEntryListPrimitive {
    return this.entries.map((entry) => entry.toPrimitive());
  }
}
