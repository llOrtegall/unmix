import { InvalidAvatarUrlError } from "./errors/InvalidAvatarUrlError.ts";

export type AvatarUrlPrimitive = string;

export class AvatarUrl {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): AvatarUrl {
    AvatarUrl.ensureIsAbsolute(value);
    return new AvatarUrl(value);
  }

  static fromPrimitive(data: AvatarUrlPrimitive): AvatarUrl {
    return AvatarUrl.create(data);
  }

  private static ensureIsAbsolute(value: string): void {
    if (!URL.canParse(value)) throw new InvalidAvatarUrlError(value);
  }

  equals(other: AvatarUrl): boolean {
    return this.value === other.value;
  }

  toPrimitive(): AvatarUrlPrimitive {
    return this.value;
  }
}
