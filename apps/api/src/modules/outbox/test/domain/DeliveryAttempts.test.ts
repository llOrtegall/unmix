import { describe, expect, it } from "vitest";
import { DeliveryAttempts } from "../../domain/DeliveryAttempts.ts";
import { InvalidDeliveryAttemptsError } from "../../domain/errors/InvalidDeliveryAttemptsError.ts";

describe("DeliveryAttempts", () => {
  it("survives a primitive round-trip", () => {
    expect(DeliveryAttempts.fromPrimitive(3).toPrimitive()).toBe(3);
  });

  it("counts one more attempt without changing the original", () => {
    const none = DeliveryAttempts.none();

    expect(none.increment().toPrimitive()).toBe(1);
    expect(none.toPrimitive()).toBe(0);
  });

  it("compares by value", () => {
    expect(DeliveryAttempts.create(2).equals(DeliveryAttempts.none().increment().increment())).toBe(true);
    expect(DeliveryAttempts.create(2).equals(DeliveryAttempts.none())).toBe(false);
  });

  it.each([-1, 1.5])("rejects %s", (value) => {
    expect(() => DeliveryAttempts.create(value)).toThrow(InvalidDeliveryAttemptsError);
  });
});
