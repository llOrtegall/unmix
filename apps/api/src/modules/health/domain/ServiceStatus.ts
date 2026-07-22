import { InvalidServiceStatusError } from "./errors/InvalidServiceStatusError.ts";

const STATUSES = ["ok", "error"] as const;

export type ServiceStatusPrimitive = (typeof STATUSES)[number];

export class ServiceStatus {
  private readonly value: ServiceStatusPrimitive;

  private constructor(value: ServiceStatusPrimitive) {
    this.value = value;
  }

  static create(value: string): ServiceStatus {
    ServiceStatus.ensureIsKnown(value);
    return new ServiceStatus(value);
  }

  static ok(): ServiceStatus {
    return ServiceStatus.create("ok");
  }

  static error(): ServiceStatus {
    return ServiceStatus.create("error");
  }

  static fromPrimitive(data: ServiceStatusPrimitive): ServiceStatus {
    return ServiceStatus.create(data);
  }

  private static ensureIsKnown(value: string): asserts value is ServiceStatusPrimitive {
    if (!STATUSES.includes(value as ServiceStatusPrimitive)) throw new InvalidServiceStatusError(value);
  }

  isOk(): boolean {
    return this.value === "ok";
  }

  equals(other: ServiceStatus): boolean {
    return this.value === other.value;
  }

  toPrimitive(): ServiceStatusPrimitive {
    return this.value;
  }
}
