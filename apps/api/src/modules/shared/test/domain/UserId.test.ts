import { describe, expect, it } from "vitest";
import { InvalidUserIdError } from "../../domain/errors/InvalidUserIdError.ts";
import { UserId } from "../../domain/UserId.ts";
import * as UserIdMother from "../helpers/UserIdMother.ts";

describe("UserId", () => {
  describe("Basic behaviour", () => {
    it("survives a primitive round-trip", () => {
      const primitive = UserIdMother.createPrimitive();

      expect(UserId.fromPrimitive(primitive).toPrimitive()).toBe(primitive);
    });

    it("generates a valid id that differs from the previous one", () => {
      const first = UserId.generate();

      expect(UserId.fromPrimitive(first.toPrimitive()).equals(first)).toBe(true);
      expect(UserId.generate().equals(first)).toBe(false);
    });

    it("is equal to another id with the same value in a different case", () => {
      const primitive = UserIdMother.createPrimitive();

      expect(UserId.create(primitive.toUpperCase()).equals(UserIdMother.create(primitive))).toBe(true);
    });
  });

  describe("Error scenarios", () => {
    it("rejects a value that is not a UUID", () => {
      expect(() => UserId.create(UserIdMother.invalidPrimitive())).toThrow(InvalidUserIdError);
    });

    it("carries a stable error code", () => {
      expect(() => UserId.create("")).toThrow(expect.objectContaining({ code: "user.invalid_id" }));
    });
  });
});
