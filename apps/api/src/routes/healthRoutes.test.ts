import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import type { HealthModule } from "../modules/health/application/factory.ts";
import { HealthReport, type HealthReportPrimitive } from "../modules/health/domain/HealthReport.ts";
import { healthRoutes } from "./healthRoutes.ts";

const appReporting = (report: HealthReportPrimitive) =>
  Fastify().register(healthRoutes({ checkHealth: vi.fn().mockResolvedValue(HealthReport.fromPrimitive(report)) } as HealthModule));

describe("healthRoutes", () => {
  it("responds 200 when every service answers", async () => {
    const response = await appReporting({ database: "ok", queue: "ok", storage: "ok" }).inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", checks: { database: "ok", redis: "ok", storage: "ok" } });
  });

  it("responds 503 with the failing service when one does not answer", async () => {
    const response = await appReporting({ database: "ok", queue: "error", storage: "ok" }).inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: "degraded", checks: { database: "ok", redis: "error", storage: "ok" } });
  });
});
