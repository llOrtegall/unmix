import { DuplicatedStemError } from "./errors/DuplicatedStemError.ts";
import { PlayableStem, type PlayableStemPrimitive } from "./PlayableStem.ts";

export type PlayableStemListPrimitive = readonly PlayableStemPrimitive[];

export class PlayableStemList {
  private readonly stems: readonly PlayableStem[];

  private constructor(stems: readonly PlayableStem[]) {
    this.stems = stems;
  }

  static create(stems: readonly PlayableStem[]): PlayableStemList {
    PlayableStemList.ensureHasNoDuplicates(stems);
    return new PlayableStemList([...stems]);
  }

  static empty(): PlayableStemList {
    return PlayableStemList.create([]);
  }

  static fromPrimitive(data: PlayableStemListPrimitive): PlayableStemList {
    return PlayableStemList.create(data.map(PlayableStem.fromPrimitive));
  }

  private static ensureHasNoDuplicates(stems: readonly PlayableStem[]): void {
    const names = stems.map((playable) => playable.getStem().getName().toPrimitive());
    const duplicated = names.find((name, index) => names.indexOf(name) !== index);
    if (duplicated) throw new DuplicatedStemError(duplicated);
  }

  count(): number {
    return this.stems.length;
  }

  equals(other: PlayableStemList): boolean {
    return this.count() === other.count() && this.stems.every((stem, index) => other.stems[index]?.equals(stem));
  }

  toPrimitive(): PlayableStemListPrimitive {
    return this.stems.map((stem) => stem.toPrimitive());
  }
}
