import { describe, expect, it } from "vitest";
import { InvalidServiceStatusError } from "../../domain/errors/InvalidServiceStatusError.ts";
import { ServiceStatus } from "../../domain/ServiceStatus.ts";

describe("ServiceStatus", () => {
  it("survives a primitive round-trip", () => {
    expect(ServiceStatus.fromPrimitive("error").toPrimitive()).toBe("error");
  });

  it("is ok only when the service answered", () => {
    expect(ServiceStatus.ok().isOk()).toBe(true);
    expect(ServiceStatus.error().isOk()).toBe(false);
  });

  it("compares by value", () => {
    expect(ServiceStatus.ok().equals(ServiceStatus.create("ok"))).toBe(true);
    expect(ServiceStatus.ok().equals(ServiceStatus.error())).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(() => ServiceStatus.create("maybe")).toThrow(InvalidServiceStatusError);
  });
});
