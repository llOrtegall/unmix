import { InvalidStageError } from "./errors/InvalidStageError.ts";

const STAGES = ["downloading", "normalizing", "separating", "uploading"] as const;

export type StagePrimitive = (typeof STAGES)[number];

export class Stage {
  private readonly value: StagePrimitive;

  private constructor(value: StagePrimitive) {
    this.value = value;
  }

  static create(value: string): Stage {
    Stage.ensureIsKnown(value);
    return new Stage(value);
  }

  static uploading(): Stage {
    return Stage.create("uploading");
  }

  static fromPrimitive(data: StagePrimitive): Stage {
    return Stage.create(data);
  }

  private static ensureIsKnown(value: string): asserts value is StagePrimitive {
    if (!STAGES.includes(value as StagePrimitive)) throw new InvalidStageError(value);
  }

  equals(other: Stage): boolean {
    return this.value === other.value;
  }

  toPrimitive(): StagePrimitive {
    return this.value;
  }
}
