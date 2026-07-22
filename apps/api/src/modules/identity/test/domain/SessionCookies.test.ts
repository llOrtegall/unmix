import { describe, expect, it } from "vitest";
import { InvalidSessionCookiesError } from "../../domain/errors/InvalidSessionCookiesError.ts";
import { SessionCookies } from "../../domain/SessionCookies.ts";

describe("SessionCookies", () => {
  it("survives a primitive round-trip", () => {
    expect(SessionCookies.fromPrimitive("better-auth.session_token=abc").toPrimitive()).toBe("better-auth.session_token=abc");
  });

  it("is empty without any cookie", () => {
    expect(SessionCookies.create("  ").isEmpty()).toBe(true);
    expect(SessionCookies.create("theme=dark").isEmpty()).toBe(false);
  });

  it("compares by value", () => {
    expect(SessionCookies.create(" a=1 ").equals(SessionCookies.create("a=1"))).toBe(true);
    expect(SessionCookies.create("a=1").equals(SessionCookies.create("a=2"))).toBe(false);
  });

  it("rejects a header larger than any browser sends", () => {
    expect(() => SessionCookies.create("a".repeat(16_385))).toThrow(InvalidSessionCookiesError);
  });
});
