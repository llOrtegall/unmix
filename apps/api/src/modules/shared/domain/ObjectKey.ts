import { InvalidObjectKeyError } from "./errors/InvalidObjectKeyError.ts";

export type ObjectKeyPrimitive = string;

export class ObjectKey {
  private static readonly MAX_LENGTH = 1024;
  private static readonly SEPARATOR = "/";

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): ObjectKey {
    ObjectKey.ensureIsNotEmpty(value);
    ObjectKey.ensureIsRelative(value);
    ObjectKey.ensureHasNoParentSegments(value);
    ObjectKey.ensureDoesNotExceedMaxLength(value);
    return new ObjectKey(value);
  }

  static fromPrimitive(data: ObjectKeyPrimitive): ObjectKey {
    return ObjectKey.create(data);
  }

  private static ensureIsNotEmpty(value: string): void {
    if (value.trim().length === 0) throw new InvalidObjectKeyError(value, "it is empty");
  }

  private static ensureIsRelative(value: string): void {
    if (value.startsWith(ObjectKey.SEPARATOR)) throw new InvalidObjectKeyError(value, "it starts with a slash");
  }

  private static ensureHasNoParentSegments(value: string): void {
    if (value.split(ObjectKey.SEPARATOR).includes("..")) throw new InvalidObjectKeyError(value, "it contains '..'");
  }

  private static ensureDoesNotExceedMaxLength(value: string): void {
    if (value.length > ObjectKey.MAX_LENGTH) {
      throw new InvalidObjectKeyError(value, `it exceeds ${ObjectKey.MAX_LENGTH} characters`);
    }
  }

  isFolder(): boolean {
    return this.value.endsWith(ObjectKey.SEPARATOR);
  }

  child(name: string): ObjectKey {
    const folder = this.isFolder() ? this.value : `${this.value}${ObjectKey.SEPARATOR}`;
    return ObjectKey.create(`${folder}${name}`);
  }

  equals(other: ObjectKey): boolean {
    return this.value === other.value;
  }

  toPrimitive(): ObjectKeyPrimitive {
    return this.value;
  }
}
