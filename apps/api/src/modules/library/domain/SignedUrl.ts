import { InvalidSignedUrlError } from "./errors/InvalidSignedUrlError.ts";

export type SignedUrlPrimitive = string;

export class SignedUrl {
  private static readonly PROTOCOLS = ["http:", "https:"];

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): SignedUrl {
    SignedUrl.ensureIsAnHttpUrl(value);
    return new SignedUrl(value);
  }

  static fromPrimitive(data: SignedUrlPrimitive): SignedUrl {
    return SignedUrl.create(data);
  }

  private static ensureIsAnHttpUrl(value: string): void {
    if (!SignedUrl.PROTOCOLS.includes(URL.parse(value)?.protocol ?? "")) throw new InvalidSignedUrlError(value);
  }

  equals(other: SignedUrl): boolean {
    return this.value === other.value;
  }

  toPrimitive(): SignedUrlPrimitive {
    return this.value;
  }
}
