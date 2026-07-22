import { ServiceStatus, type ServiceStatusPrimitive } from "./ServiceStatus.ts";

export interface HealthReportPrimitive {
  readonly database: ServiceStatusPrimitive;
  readonly queue: ServiceStatusPrimitive;
  readonly storage: ServiceStatusPrimitive;
}

export interface HealthReportAttributes {
  readonly database: ServiceStatus;
  readonly queue: ServiceStatus;
  readonly storage: ServiceStatus;
}

export class HealthReport {
  private readonly database: ServiceStatus;
  private readonly queue: ServiceStatus;
  private readonly storage: ServiceStatus;

  private constructor(attributes: HealthReportAttributes) {
    this.database = attributes.database;
    this.queue = attributes.queue;
    this.storage = attributes.storage;
  }

  static create(attributes: HealthReportAttributes): HealthReport {
    return new HealthReport(attributes);
  }

  static fromPrimitive(data: HealthReportPrimitive): HealthReport {
    return HealthReport.create({
      database: ServiceStatus.fromPrimitive(data.database),
      queue: ServiceStatus.fromPrimitive(data.queue),
      storage: ServiceStatus.fromPrimitive(data.storage),
    });
  }

  isHealthy(): boolean {
    return this.database.isOk() && this.queue.isOk() && this.storage.isOk();
  }

  equals(other: HealthReport): boolean {
    return this.database.equals(other.database) && this.queue.equals(other.queue) && this.storage.equals(other.storage);
  }

  toPrimitive(): HealthReportPrimitive {
    return { database: this.database.toPrimitive(), queue: this.queue.toPrimitive(), storage: this.storage.toPrimitive() };
  }
}
