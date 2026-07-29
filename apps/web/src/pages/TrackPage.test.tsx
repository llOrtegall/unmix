import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { separation } from "@/modules/separation/application/factory.ts";
import type { JobListener } from "@/modules/separation/domain/JobListener.ts";
import * as JobMother from "@/modules/separation/test/helpers/JobMother.ts";
import { tracks } from "@/modules/track/application/factory.ts";
import { TrackNotFoundError } from "@/modules/track/domain/errors/TrackNotFoundError.ts";
import { Waveforms } from "@/modules/track/domain/Waveforms.ts";
import * as TrackMother from "@/modules/track/test/helpers/TrackMother.ts";
import { chooseSpanish } from "@/test/chooseSpanish.ts";
import { TrackPage } from "./TrackPage.tsx";

vi.mock("@/modules/track/application/factory.ts", () => ({ tracks: { findTrack: vi.fn() } }));
vi.mock("@/modules/separation/application/factory.ts", () => ({ separation: { watchJob: vi.fn(), requestSeparation: vi.fn() } }));
vi.mock("@/components/Mixer.tsx", () => ({ Mixer: () => <p>mixer</p> }));

describe("TrackPage", () => {
  beforeEach(() => chooseSpanish());

  it("opens the mixer for a separated song, with its credit and title", async () => {
    const track = TrackMother.create({ title: "La", credit: "Music: La by Shane Ivers https://example.test" });
    vi.mocked(tracks.findTrack).mockResolvedValue({ track, waveforms: Waveforms.empty() });

    render(<TrackPage id={track.getSummary().getId().toPrimitive()} />);

    expect(await screen.findByRole("heading", { name: /La/ })).toBeVisible();
    expect(screen.getByText("mixer")).toBeVisible();
    expect(screen.getByRole("link", { name: "example.test" })).toHaveAttribute("href", "https://example.test");
    await vi.waitFor(() => expect(document.title).toBe("La · unmix"));
  });

  it("follows the separation and reloads the song once its job fails", async () => {
    const track = TrackMother.separating();
    const { id, latestJobId } = track.toPrimitive();
    vi.mocked(tracks.findTrack).mockResolvedValue({ track, waveforms: Waveforms.empty() });
    vi.mocked(separation.watchJob).mockImplementation(async (_, listener: JobListener) => {
      listener.onUpdate(JobMother.failed("separation.invalid_media", { id: latestJobId!, trackId: id }));
      return vi.fn<() => void>();
    });

    render(<TrackPage id={id} />);

    expect(await screen.findByText("No pudimos leer el audio de este archivo. ¿Está dañado?")).toBeVisible();
    await vi.waitFor(() => expect(tracks.findTrack).toHaveBeenCalledTimes(2));
  });

  it("explains a song whose upload never finished", async () => {
    const track = TrackMother.withoutJob();
    vi.mocked(tracks.findTrack).mockResolvedValue({ track, waveforms: Waveforms.empty() });

    render(<TrackPage id={track.toPrimitive().id} />);

    expect(await screen.findByText("El archivo no llegó a subirse. Vuelve a intentarlo.")).toBeVisible();
  });

  it("sends the user back to the library when the song does not exist", async () => {
    const id = faker.string.uuid();
    vi.mocked(tracks.findTrack).mockRejectedValue(new TrackNotFoundError(id));

    render(<TrackPage id={id} />);

    expect(await screen.findByText("Esta canción ya no existe.")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Biblioteca" })).toHaveLength(2);
  });
});
