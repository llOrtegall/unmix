import type { ApiError } from "@unmix/contracts";
import type { DomainError } from "../domain/DomainError.ts";
import { RequestFailedError } from "../domain/errors/RequestFailedError.ts";
import { SessionExpiredError } from "../domain/errors/SessionExpiredError.ts";
import type { Unsubscribe } from "../domain/Unsubscribe.ts";

const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const NO_CONTENT = 204;

const sessionExpiryListeners = new Set<() => void>();

export const onSessionExpired = (listener: () => void): Unsubscribe => {
  sessionExpiryListeners.add(listener);
  return () => sessionExpiryListeners.delete(listener);
};

const send = async (url: string, init: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, { ...init, headers: init.body ? { "content-type": "application/json" } : undefined });
  } catch {
    throw RequestFailedError.network(url);
  }
};

const readErrorCode = async (response: Response): Promise<string | undefined> => {
  const body = (await response.json().catch(() => null)) as Partial<ApiError> | null;
  return typeof body?.code === "string" ? body.code : undefined;
};

const failureOf = async (url: string, response: Response): Promise<DomainError> => {
  if (response.status !== UNAUTHORIZED) return new RequestFailedError(url, response.status, await readErrorCode(response));
  for (const listener of sessionExpiryListeners) listener();
  return new SessionExpiredError();
};

export const httpGet = async <T>(url: string): Promise<T | null> => {
  const response = await send(url, {});
  if (response.status === NOT_FOUND) return null;
  if (!response.ok) throw await failureOf(url, response);
  return (await response.json()) as T;
};

export const httpSend = async <T = void>(url: string, init: RequestInit): Promise<T> => {
  const response = await send(url, init);
  if (!response.ok) throw await failureOf(url, response);
  return (response.status === NO_CONTENT ? undefined : await response.json()) as T;
};
