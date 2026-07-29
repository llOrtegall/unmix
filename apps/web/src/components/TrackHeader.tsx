import { formatDuration } from "@/lib/utils.ts";
import type { TrackSummary } from "@/modules/track/domain/TrackSummary.ts";
import { Credit } from "./Credit.tsx";
import { DemoBadge } from "./DemoBadge.tsx";
import { StatusBadge } from "./StatusBadge.tsx";

export function TrackHeader({ track }: { track: TrackSummary }) {
  const credit = track.getCredit();
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          <span className="truncate">{track.getTitle().toPrimitive()}</span>
          {track.isDemo() && <DemoBadge />}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{formatDuration(track.getDuration()?.toPrimitive())}</p>
        {credit && <Credit credit={credit} />}
      </div>
      <StatusBadge status={track.getStatus()} />
    </header>
  );
}
