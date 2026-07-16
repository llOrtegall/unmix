import { DuplicatedStemError } from "./errors/DuplicatedStemError.ts";
import { Stem, type StemPrimitive } from "./Stem.ts";

export type StemListPrimitive = readonly StemPrimitive[];

export class StemList {
  private readonly stems: readonly Stem[];

  private constructor(stems: readonly Stem[]) {
    this.stems = stems;
  }

  static create(stems: readonly Stem[]): StemList {
    StemList.ensureHasNoDuplicates(stems);
    return new StemList([...stems]);
  }

  static empty(): StemList {
    return StemList.create([]);
  }

  static fromPrimitive(data: StemListPrimitive): StemList {
    return StemList.create(data.map(Stem.fromPrimitive));
  }

  private static ensureHasNoDuplicates(stems: readonly Stem[]): void {
    const names = stems.map((stem) => stem.getName().toPrimitive());
    const duplicated = names.find((name, index) => names.indexOf(name) !== index);
    if (duplicated) throw new DuplicatedStemError(duplicated);
  }

  map<T>(transform: (stem: Stem) => T): T[] {
    return this.stems.map(transform);
  }

  count(): number {
    return this.stems.length;
  }

  isEmpty(): boolean {
    return this.stems.length === 0;
  }

  equals(other: StemList): boolean {
    return this.count() === other.count() && this.stems.every((stem, index) => other.stems[index]?.equals(stem));
  }

  toPrimitive(): StemListPrimitive {
    return this.stems.map((stem) => stem.toPrimitive());
  }
}
