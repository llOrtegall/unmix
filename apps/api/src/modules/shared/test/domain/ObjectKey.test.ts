import { describe, expect, it } from "vitest";
import { InvalidObjectKeyError } from "../../domain/errors/InvalidObjectKeyError.ts";
import { ObjectKey } from "../../domain/ObjectKey.ts";
import * as ObjectKeyMother from "../helpers/ObjectKeyMother.ts";

describe("ObjectKey", () => {
  describe("Basic behaviour", () => {
    it("survives a primitive round-trip", () => {
      const primitive = ObjectKeyMother.createPrimitive();

      expect(ObjectKey.fromPrimitive(primitive).toPrimitive()).toBe(primitive);
    });

    it("builds child keys under a folder or a plain prefix", () => {
      expect(ObjectKey.create("tracks/").child("a.mp3").toPrimitive()).toBe("tracks/a.mp3");
      expect(ObjectKey.create("tracks/1/stems").child("vocals.flac").toPrimitive()).toBe("tracks/1/stems/vocals.flac");
    });

    it("tells folders apart from objects", () => {
      expect(ObjectKey.create("tracks/").isFolder()).toBe(true);
      expect(ObjectKey.create("tracks/a.mp3").isFolder()).toBe(false);
    });

    it("compares by value", () => {
      const key = ObjectKeyMother.create();

      expect(key.equals(ObjectKey.create(key.toPrimitive()))).toBe(true);
      expect(key.equals(ObjectKeyMother.create("other/key"))).toBe(false);
    });
  });

  describe("Error scenarios", () => {
    it.each([
      ["an empty key", " "],
      ["an absolute key", "/tracks/a.mp3"],
      ["a key that climbs out", "tracks/../secrets"],
      ["a key that is too long", "a".repeat(1025)],
    ])("rejects %s", (_name, value) => {
      expect(() => ObjectKey.create(value)).toThrow(InvalidObjectKeyError);
    });
  });
});
