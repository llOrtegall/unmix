import { DomainError } from "../DomainError.ts";

export class RequestFailedError extends DomainError {
  static readonly NETWORK_FAILURE_STATUS = 0;
  private static readonly GENERIC_CODE = "request.failed";
  private static readonly NETWORK_CODE = "request.network";

  readonly code: string;
  readonly status: number;

  constructor(url: string, status: number, code?: string) {
    super(`Request to ${url} failed with status ${status}`);
    this.status = status;
    this.code = RequestFailedError.codeFor(status, code);
  }

  static network(url: string): RequestFailedError {
    return new RequestFailedError(url, RequestFailedError.NETWORK_FAILURE_STATUS);
  }

  private static codeFor(status: number, code: string | undefined): string {
    if (status === RequestFailedError.NETWORK_FAILURE_STATUS) return RequestFailedError.NETWORK_CODE;
    return code ?? RequestFailedError.GENERIC_CODE;
  }

  isNetworkFailure(): boolean {
    return this.status === RequestFailedError.NETWORK_FAILURE_STATUS;
  }
}
