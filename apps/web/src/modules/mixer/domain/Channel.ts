import { StemName, type StemNamePrimitive } from "../../track/domain/StemName.ts";
import { Volume, type VolumePrimitive } from "./Volume.ts";

export interface ChannelPrimitive {
  readonly name: StemNamePrimitive;
  readonly volume: VolumePrimitive;
  readonly muted: boolean;
  readonly soloed: boolean;
}

export interface ChannelAttributes {
  readonly name: StemName;
  readonly volume: Volume;
  readonly muted: boolean;
  readonly soloed: boolean;
}

export class Channel {
  private readonly name: StemName;
  private readonly volume: Volume;
  private readonly muted: boolean;
  private readonly soloed: boolean;

  private constructor(attributes: ChannelAttributes) {
    this.name = attributes.name;
    this.volume = attributes.volume;
    this.muted = attributes.muted;
    this.soloed = attributes.soloed;
  }

  static create(attributes: ChannelAttributes): Channel {
    return new Channel(attributes);
  }

  static forStem(name: StemName): Channel {
    return Channel.create({ name, volume: Volume.default(), muted: false, soloed: false });
  }

  static fromPrimitive(data: ChannelPrimitive): Channel {
    return Channel.create({
      name: StemName.fromPrimitive(data.name),
      volume: Volume.fromPrimitive(data.volume),
      muted: data.muted,
      soloed: data.soloed,
    });
  }

  getName(): StemName {
    return this.name;
  }

  getVolume(): Volume {
    return this.volume;
  }

  isMuted(): boolean {
    return this.muted;
  }

  isSoloed(): boolean {
    return this.soloed;
  }

  withVolume(volume: Volume): Channel {
    return Channel.create({ ...this.attributes(), volume });
  }

  toggleMute(): Channel {
    return Channel.create({ ...this.attributes(), muted: !this.muted });
  }

  toggleSolo(): Channel {
    return Channel.create({ ...this.attributes(), soloed: !this.soloed });
  }

  unsolo(): Channel {
    return Channel.create({ ...this.attributes(), soloed: false });
  }

  equals(other: Channel): boolean {
    return (
      this.name.equals(other.name) && this.volume.equals(other.volume) && this.muted === other.muted && this.soloed === other.soloed
    );
  }

  toPrimitive(): ChannelPrimitive {
    return { name: this.name.toPrimitive(), volume: this.volume.toPrimitive(), muted: this.muted, soloed: this.soloed };
  }

  private attributes(): ChannelAttributes {
    return { name: this.name, volume: this.volume, muted: this.muted, soloed: this.soloed };
  }
}
