import { InvalidPlayheadError } from "./errors/InvalidPlayheadError.ts";

export interface PlayheadPrimitive {
  readonly positionSeconds: number;
  readonly durationSeconds: number;
}

export class Playhead {
  private readonly position: number;
  private readonly duration: number;

  private constructor(position: number, duration: number) {
    this.position = position;
    this.duration = duration;
  }

  static create(position: number, duration: number): Playhead {
    Playhead.ensureIsNotNegative(position, duration);
    return new Playhead(position, duration);
  }

  static start(): Playhead {
    return Playhead.create(0, 0);
  }

  static fromPrimitive(data: PlayheadPrimitive): Playhead {
    return Playhead.create(data.positionSeconds, data.durationSeconds);
  }

  private static ensureIsNotNegative(position: number, duration: number): void {
    if (!(position >= 0 && duration >= 0)) throw new InvalidPlayheadError(`${position} s of ${duration} s`);
  }

  moveTo(fraction: number): Playhead {
    const clamped = Math.min(Math.max(fraction, 0), 1);
    return Playhead.create(clamped * this.duration, this.duration);
  }

  fraction(): number {
    return this.duration > 0 ? Math.min(this.position / this.duration, 1) : 0;
  }

  equals(other: Playhead): boolean {
    return this.position === other.position && this.duration === other.duration;
  }

  toPrimitive(): PlayheadPrimitive {
    return { positionSeconds: this.position, durationSeconds: this.duration };
  }
}
