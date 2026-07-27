import { InvalidStemNameError } from "./errors/InvalidStemNameError.ts";

// Mixer order: the parts people look for first come first.
const NAMES = ["vocals", "drums", "bass", "guitar", "piano", "other"] as const;

export type StemNamePrimitive = (typeof NAMES)[number];

export class StemName {
  private readonly value: StemNamePrimitive;

  private constructor(value: StemNamePrimitive) {
    this.value = value;
  }

  static create(value: string): StemName {
    StemName.ensureIsKnown(value);
    return new StemName(value);
  }

  static all(): StemName[] {
    return NAMES.map((name) => StemName.create(name));
  }

  static fromPrimitive(data: StemNamePrimitive): StemName {
    return StemName.create(data);
  }

  private static ensureIsKnown(value: string): asserts value is StemNamePrimitive {
    if (!NAMES.includes(value as StemNamePrimitive)) throw new InvalidStemNameError(value);
  }

  comesBefore(other: StemName): boolean {
    return NAMES.indexOf(this.value) < NAMES.indexOf(other.value);
  }

  equals(other: StemName): boolean {
    return this.value === other.value;
  }

  toPrimitive(): StemNamePrimitive {
    return this.value;
  }
}
