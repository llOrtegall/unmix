import { InvalidModelNameError } from "./errors/InvalidModelNameError.ts";

const MODELS = ["htdemucs_6s", "htdemucs_ft", "htdemucs"] as const;

export type ModelNamePrimitive = (typeof MODELS)[number];

export class ModelName {
  private readonly value: ModelNamePrimitive;

  private constructor(value: ModelNamePrimitive) {
    this.value = value;
  }

  static create(value: string): ModelName {
    ModelName.ensureIsSupported(value);
    return new ModelName(value);
  }

  static fromPrimitive(data: ModelNamePrimitive): ModelName {
    return ModelName.create(data);
  }

  private static ensureIsSupported(value: string): asserts value is ModelNamePrimitive {
    if (!MODELS.includes(value as ModelNamePrimitive)) throw new InvalidModelNameError(value);
  }

  equals(other: ModelName): boolean {
    return this.value === other.value;
  }

  toPrimitive(): ModelNamePrimitive {
    return this.value;
  }
}
