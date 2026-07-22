import { describe, expect, it } from "vitest";
import { HealthReport } from "../../domain/HealthReport.ts";

describe("HealthReport", () => {
  it("survives a primitive round-trip", () => {
    const primitive = { database: "ok", queue: "error", storage: "ok" } as const;

    expect(HealthReport.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("is healthy only when every service is ok", () => {
    expect(HealthReport.fromPrimitive({ database: "ok", queue: "ok", storage: "ok" }).isHealthy()).toBe(true);
    expect(HealthReport.fromPrimitive({ database: "ok", queue: "ok", storage: "error" }).isHealthy()).toBe(false);
  });

  it("compares by every status", () => {
    const healthy = HealthReport.fromPrimitive({ database: "ok", queue: "ok", storage: "ok" });

    expect(healthy.equals(HealthReport.fromPrimitive({ database: "ok", queue: "ok", storage: "ok" }))).toBe(true);
    expect(healthy.equals(HealthReport.fromPrimitive({ database: "error", queue: "ok", storage: "ok" }))).toBe(false);
  });
});
