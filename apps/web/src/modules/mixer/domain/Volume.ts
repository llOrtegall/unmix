import { InvalidVolumeError } from "./errors/InvalidVolumeError.ts";

const SILENT = 0;
const FULL = 1;
const DEFAULT = 0.8;

export type VolumePrimitive = number;

export class Volume {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(value: number): Volume {
    Volume.ensureIsInRange(value);
    return new Volume(value);
  }

  static default(): Volume {
    return Volume.create(DEFAULT);
  }

  static silent(): Volume {
    return Volume.create(SILENT);
  }

  static fromPrimitive(data: VolumePrimitive): Volume {
    return Volume.create(data);
  }

  private static ensureIsInRange(value: number): void {
    if (!(value >= SILENT && value <= FULL)) throw new InvalidVolumeError(value);
  }

  equals(other: Volume): boolean {
    return this.value === other.value;
  }

  toPrimitive(): VolumePrimitive {
    return this.value;
  }
}
