import { InvalidUrlError } from "./errors/InvalidUrlError.ts";

const ROOT = "/";

export type UrlPrimitive = string;

export class Url {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Url {
    Url.ensureIsAbsoluteOrRootRelative(value);
    return new Url(value);
  }

  static fromPrimitive(data: UrlPrimitive): Url {
    return Url.create(data);
  }

  private static ensureIsAbsoluteOrRootRelative(value: string): void {
    const isRootRelative = value.startsWith(ROOT) && !value.startsWith("//");
    if (!isRootRelative && !URL.canParse(value)) throw new InvalidUrlError(value);
  }

  equals(other: Url): boolean {
    return this.value === other.value;
  }

  toPrimitive(): UrlPrimitive {
    return this.value;
  }
}
