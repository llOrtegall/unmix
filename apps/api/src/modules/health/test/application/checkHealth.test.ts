import { describe, expect, it } from "vitest";
import { checkHealth } from "../../application/checkHealth.ts";
import * as HealthRepositoryMother from "../helpers/HealthRepositoryMother.ts";

describe("checkHealth", () => {
  it("reports every service as ok when they all answer", async () => {
    const report = await checkHealth({
      databaseHealthRepository: HealthRepositoryMother.create(),
      queueHealthRepository: HealthRepositoryMother.create(),
      storageHealthRepository: HealthRepositoryMother.create(),
    })();

    expect(report.toPrimitive()).toEqual({ database: "ok", queue: "ok", storage: "ok" });
    expect(report.isHealthy()).toBe(true);
  });

  it("reports the services that do not answer without failing", async () => {
    const report = await checkHealth({
      databaseHealthRepository: HealthRepositoryMother.create(),
      queueHealthRepository: HealthRepositoryMother.down(),
      storageHealthRepository: HealthRepositoryMother.down(),
    })();

    expect(report.toPrimitive()).toEqual({ database: "ok", queue: "error", storage: "error" });
  });
});
