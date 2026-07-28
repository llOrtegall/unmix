import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { JobFailure } from "@/modules/separation/domain/JobFailure.ts";
import { RequestFailedError } from "@/modules/shared/domain/errors/RequestFailedError.ts";
import { SessionExpiredError } from "@/modules/shared/domain/errors/SessionExpiredError.ts";
import { FileTooLargeError } from "@/modules/track/domain/errors/FileTooLargeError.ts";
import { useErrorMessage } from "./errorMessages.ts";
import { useLocale } from "./useT.ts";

describe("useErrorMessage", () => {
  beforeEach(() => act(() => useLocale.getState().setLocale("es")));

  const message = () => renderHook(() => useErrorMessage()).result.current;

  it("maps an error code to its text, with the upload limit filled in", () => {
    expect(message()(new SessionExpiredError())).toBe("Tu sesión terminó. Vuelve a iniciar sesión.");
    expect(message()(new FileTooLargeError(200))).toBe("El archivo supera el límite de 200 MB.");
  });

  it("maps an API error code carried by a failed request", () => {
    expect(message()(new RequestFailedError("/api/v1/tracks/1", 409, "track.busy"))).toBe("Esta canción ya se está procesando. Espera a que termine.");
    expect(message()(RequestFailedError.network("/api/v1/tracks"))).toBe("No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.");
  });

  it("maps a job failure", () => {
    expect(message()(JobFailure.create("separation.duration_exceeded", "Track lasts 720 s"))).toBe("La canción dura más de 10 minutos.");
  });

  it("falls back to a generic text for codes without one", () => {
    expect(message()(JobFailure.create("separation.invalid_peaks", ""))).toBe("Algo salió mal. Inténtalo de nuevo.");
  });

  it("follows the chosen language", () => {
    act(() => useLocale.getState().setLocale("en"));

    expect(message()(new SessionExpiredError())).toBe("Your session ended. Please sign in again.");
  });
});
