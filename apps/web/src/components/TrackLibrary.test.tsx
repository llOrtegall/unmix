import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestFailedError } from "@/modules/shared/domain/errors/RequestFailedError.ts";
import { tracks } from "@/modules/track/application/factory.ts";
import { PageCursor } from "@/modules/track/domain/PageCursor.ts";
import { TrackList } from "@/modules/track/domain/TrackList.ts";
import { TrackPage } from "@/modules/track/domain/TrackPage.ts";
import * as TrackSummaryMother from "@/modules/track/test/helpers/TrackSummaryMother.ts";
import { chooseSpanish } from "@/test/chooseSpanish.ts";
import { TrackLibrary } from "./TrackLibrary.tsx";

vi.mock("@/modules/track/application/factory.ts", () => ({
  tracks: { listTracks: vi.fn(), deleteTrack: vi.fn() },
}));

const page = (list: TrackList, cursor: string | null = null) => TrackPage.create(list, cursor ? PageCursor.create(cursor) : null);

describe("TrackLibrary", () => {
  const song = TrackSummaryMother.create({ title: "Lovesong" });
  const demo = TrackSummaryMother.demo({ title: "La" });

  beforeEach(() => {
    chooseSpanish();
    vi.mocked(tracks.listTracks).mockResolvedValue(page(TrackList.create([song, demo])));
  });

  it("lists the songs with their status and the demo badge", async () => {
    render(<TrackLibrary />);

    const rows = await screen.findAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Lovesong");
    expect(rows[0]).toHaveTextContent("Lista");
    expect(within(rows[1]!).getByText("Demo")).toBeVisible();
  });

  it("deletes a song after confirming", async () => {
    vi.mocked(tracks.deleteTrack).mockResolvedValue(undefined);
    render(<TrackLibrary />);

    const [row] = await screen.findAllByRole("listitem");
    await userEvent.click(within(row!).getByRole("button", { name: "Eliminar" }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Eliminar" }));

    expect(tracks.deleteTrack).toHaveBeenCalledWith(song.getId().toPrimitive());
    expect(screen.queryByText("Lovesong")).not.toBeInTheDocument();
  });

  it("does not let a song be deleted while it is being separated", async () => {
    vi.mocked(tracks.listTracks).mockResolvedValue(page(TrackList.create([TrackSummaryMother.separating()])));
    render(<TrackLibrary />);

    expect(await screen.findByRole("button", { name: "Eliminar" })).toBeDisabled();
  });

  it("explains an empty library", async () => {
    vi.mocked(tracks.listTracks).mockResolvedValue(page(TrackList.empty()));
    render(<TrackLibrary />);

    expect(await screen.findByText("Todavía no hay canciones. Sube la primera para empezar.")).toBeVisible();
  });

  it("loads the next page", async () => {
    const older = TrackSummaryMother.create({ title: "Older" });
    vi.mocked(tracks.listTracks)
      .mockResolvedValueOnce(page(TrackList.create([song]), "2026-07-01T10:00:00.000Z"))
      .mockResolvedValueOnce(page(TrackList.create([older])));
    render(<TrackLibrary />);

    await userEvent.click(await screen.findByRole("button", { name: "Cargar más" }));

    expect(await screen.findByText("Older")).toBeVisible();
    expect(tracks.listTracks).toHaveBeenLastCalledWith("2026-07-01T10:00:00.000Z");
    expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
  });

  it("shows the dictionary message when the library cannot be loaded, and retries", async () => {
    vi.mocked(tracks.listTracks).mockRejectedValueOnce(RequestFailedError.network("/api/v1/tracks"));
    render(<TrackLibrary />);

    expect(await screen.findByText("No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Lovesong")).toBeVisible();
  });

  it("shows the API's reason when a delete is refused", async () => {
    vi.mocked(tracks.deleteTrack).mockRejectedValue(new RequestFailedError("/api/v1/tracks/1", 409, "track.busy"));
    render(<TrackLibrary />);

    await userEvent.click((await screen.findAllByRole("button", { name: "Eliminar" }))[0]!);
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Esta canción ya se está procesando.");
  });
});
