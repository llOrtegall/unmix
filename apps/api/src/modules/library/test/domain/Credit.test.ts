import { describe, expect, it } from "vitest";
import { Credit } from "../../domain/Credit.ts";
import { InvalidCreditError } from "../../domain/errors/InvalidCreditError.ts";

describe("Credit", () => {
  it("trims and keeps the attribution", () => {
    expect(Credit.fromPrimitive(" Music: La by Shane Ivers ").toPrimitive()).toBe("Music: La by Shane Ivers");
    expect(Credit.create("a").equals(Credit.create("a"))).toBe(true);
  });

  it.each([
    ["an empty credit", " "],
    ["a credit over 500 characters", "a".repeat(501)],
  ])("rejects %s", (_name, value) => {
    expect(() => Credit.create(value)).toThrow(InvalidCreditError);
  });
});
