import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMixer } from "@/hooks/useMixer.ts";
import { mixer } from "@/modules/mixer/application/factory.ts";
import type { ChannelCommand } from "@/modules/mixer/application/toggleChannelMute.ts";
import { PlaybackLoadFailedError } from "@/modules/mixer/domain/errors/PlaybackLoadFailedError.ts";
import { Mix } from "@/modules/mixer/domain/Mix.ts";
import { Playhead } from "@/modules/mixer/domain/Playhead.ts";
import { StemName } from "@/modules/track/domain/StemName.ts";
import { Waveforms } from "@/modules/track/domain/Waveforms.ts";
import * as TrackMother from "@/modules/track/test/helpers/TrackMother.ts";
import { chooseSpanish } from "@/test/chooseSpanish.ts";
import { Mixer } from "./Mixer.tsx";

vi.mock("@/modules/mixer/application/factory.ts", () => ({
  mixer: {
    loadMix: vi.fn(),
    unloadMix: vi.fn(),
    togglePlayback: vi.fn(),
    seekTo: vi.fn(),
    findPlayhead: vi.fn(),
    watchPlaybackEnd: vi.fn(() => vi.fn()),
    setChannelVolume: vi.fn(),
    toggleChannelMute: vi.fn(),
    toggleChannelSolo: vi.fn(),
    toggleExclusiveChannelSolo: vi.fn(),
  },
}));

describe("Mixer", () => {
  const track = TrackMother.create();

  beforeEach(() => {
    chooseSpanish();
    vi.mocked(mixer.loadMix).mockImplementation((stems) => ({ mix: Mix.forStems(stems.names()), ready: Promise.resolve() }));
    vi.mocked(mixer.findPlayhead).mockReturnValue(Playhead.create(3, 180));
    vi.mocked(mixer.togglePlayback).mockResolvedValue(true);
    vi.mocked(mixer.toggleChannelMute).mockImplementation(({ mix, stem }: ChannelCommand) => mix.toggleMute(StemName.create(stem)));
    vi.mocked(mixer.toggleChannelSolo).mockImplementation(({ mix, stem }: ChannelCommand) => mix.toggleSolo(StemName.create(stem)));
    vi.mocked(mixer.toggleExclusiveChannelSolo).mockImplementation(({ mix, stem }: ChannelCommand) =>
      mix.toggleExclusiveSolo(StemName.create(stem)),
    );
  });

  it("loads the stems and plays them once ready", async () => {
    render(<Mixer track={track} waveforms={Waveforms.empty()} />);

    await userEvent.click(await screen.findByRole("button", { name: "Reproducir" }));

    expect(mixer.loadMix).toHaveBeenCalledWith(track.getStems());
    expect(await screen.findByRole("button", { name: "Pausa" })).toBeVisible();
    expect(screen.getByText("0:03")).toBeVisible();
  });

  it("mutes a channel and solos another", async () => {
    render(<Mixer track={track} waveforms={Waveforms.empty()} />);

    const mute = await screen.findByRole("button", { name: "Silenciar Voz" });
    await userEvent.click(mute);
    const solo = screen.getByRole("button", { name: "Solo Batería" });
    await userEvent.click(solo);

    expect(mute).toHaveAttribute("aria-pressed", "true");
    expect(solo).toHaveAttribute("aria-pressed", "true");
  });

  it("solos a single channel with shift-click", async () => {
    render(<Mixer track={track} waveforms={Waveforms.empty()} />);
    const user = userEvent.setup();

    await user.keyboard("{Shift>}");
    await user.click(await screen.findByRole("button", { name: "Solo Bajo" }));

    expect(mixer.toggleExclusiveChannelSolo).toHaveBeenCalledWith(expect.objectContaining({ stem: "bass" }));
  });

  it("offers the FLAC and, for pitched stems, the MIDI of each stem", async () => {
    render(<Mixer track={track} waveforms={Waveforms.empty()} />);

    expect(await screen.findByRole("link", { name: "Descargar MIDI Voz" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Descargar MIDI Batería" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Descargar FLAC Bajo" })).toHaveAttribute("href", expect.stringContaining("bass.flac"));
  });

  it("explains a stem that cannot be loaded", async () => {
    vi.mocked(mixer.loadMix).mockImplementation((stems) => ({
      mix: Mix.forStems(stems.names()),
      ready: Promise.reject(new PlaybackLoadFailedError("vocals")),
    }));

    render(<Mixer track={track} waveforms={Waveforms.empty()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar las pistas.");
    expect(screen.getByRole("button", { name: "Reproducir" })).toBeDisabled();
  });

  it("stops the audio when it leaves the page", async () => {
    const { unmount } = render(<Mixer track={track} waveforms={Waveforms.empty()} />);
    await screen.findByRole("button", { name: "Reproducir" });

    unmount();

    expect(mixer.unloadMix).toHaveBeenCalled();
    act(() => expect(useMixer.getState().status).toBe("idle"));
  });
});
