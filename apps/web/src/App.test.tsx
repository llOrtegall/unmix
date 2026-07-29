import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { session } from "@/modules/session/application/factory.ts";
import { SignInFailedError } from "@/modules/session/domain/errors/SignInFailedError.ts";
import * as UserMother from "@/modules/session/test/helpers/UserMother.ts";
import { tracks } from "@/modules/track/application/factory.ts";
import { TrackList } from "@/modules/track/domain/TrackList.ts";
import { TrackPage } from "@/modules/track/domain/TrackPage.ts";
import { chooseSpanish } from "@/test/chooseSpanish.ts";
import { App } from "./App.tsx";
import { useSession } from "./hooks/useSession.ts";

vi.mock("@/modules/session/application/factory.ts", () => ({
  session: { findCurrentUser: vi.fn(), signInWithGoogle: vi.fn(), signOut: vi.fn(), watchSessionExpiry: vi.fn() },
}));
vi.mock("@/modules/track/application/factory.ts", () => ({ tracks: { listTracks: vi.fn(), uploadTrack: vi.fn(), deleteTrack: vi.fn() } }));

describe("App", () => {
  let expire: () => void = () => {};

  beforeEach(() => {
    chooseSpanish();
    window.history.replaceState(null, "", "/");
    useSession.setState({ state: { status: "loading" } });
    vi.mocked(session.watchSessionExpiry).mockImplementation((listener) => {
      expire = listener;
      return vi.fn();
    });
    vi.mocked(tracks.listTracks).mockResolvedValue(TrackPage.create(TrackList.empty(), null));
  });

  it("asks to sign in without a session, and starts the Google sign-in", async () => {
    vi.mocked(session.findCurrentUser).mockResolvedValue(null);
    vi.mocked(session.signInWithGoogle).mockResolvedValue(undefined);
    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: "Continuar con Google" }));

    expect(session.signInWithGoogle).toHaveBeenCalledOnce();
  });

  it("explains a failed Google sign-in", async () => {
    vi.mocked(session.findCurrentUser).mockRejectedValue(new SignInFailedError());
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos iniciar sesión con Google.");
  });

  it("opens the library for a signed-in user and shows their initial", async () => {
    vi.mocked(session.findCurrentUser).mockResolvedValue(UserMother.create({ name: "ada", avatarUrl: null }));
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Tus canciones" })).toBeVisible();
    expect(screen.getByText("A")).toBeVisible();
  });

  it("goes back to the sign-in page when the session expires", async () => {
    vi.mocked(session.findCurrentUser).mockResolvedValue(UserMother.create());
    render(<App />);
    await screen.findByRole("heading", { name: "Tus canciones" });

    expire();

    expect(await screen.findByRole("alert")).toHaveTextContent("Tu sesión terminó. Vuelve a iniciar sesión.");
  });

  it("signs out", async () => {
    vi.mocked(session.findCurrentUser).mockResolvedValue(UserMother.create());
    vi.mocked(session.signOut).mockResolvedValue(undefined);
    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: "Cerrar sesión" }));

    expect(await screen.findByRole("button", { name: "Continuar con Google" })).toBeVisible();
  });

  it("switches the language", async () => {
    vi.mocked(session.findCurrentUser).mockResolvedValue(UserMother.create());
    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: "en" }));

    expect(await screen.findByRole("heading", { name: "Your songs" })).toBeVisible();
    expect(document.documentElement.lang).toBe("en");
  });
});
