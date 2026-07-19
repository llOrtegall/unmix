import { describe, expect, it } from "vitest";
import { DeliveryFailure } from "../../domain/DeliveryFailure.ts";
import { InvalidDeliveryFailureError } from "../../domain/errors/InvalidDeliveryFailureError.ts";

describe("DeliveryFailure", () => {
  it("survives a primitive round-trip", () => {
    expect(DeliveryFailure.fromPrimitive("Redis is down").toPrimitive()).toBe("Redis is down");
  });

  it("describes whatever was thrown", () => {
    expect(DeliveryFailure.fromError(new Error("Redis is down")).toPrimitive()).toBe("Error: Redis is down");
    expect(DeliveryFailure.fromError("").toPrimitive()).toBe("Unknown delivery error");
  });

  it("keeps long reasons short", () => {
    expect(DeliveryFailure.create("x".repeat(5_000)).toPrimitive()).toHaveLength(2_000);
  });

  it("compares by value", () => {
    expect(DeliveryFailure.create("a").equals(DeliveryFailure.create(" a "))).toBe(true);
    expect(DeliveryFailure.create("a").equals(DeliveryFailure.create("b"))).toBe(false);
  });

  it("rejects an empty reason", () => {
    expect(() => DeliveryFailure.create("  ")).toThrow(InvalidDeliveryFailureError);
  });
});
