import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { TrackStatus } from "@/domain/track.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { useT } from "@/presentation/i18n/use-t.ts";

export function StatusBadge({ status }: { status: TrackStatus }) {
  const t = useT();
  const label = t(`status.${status}`);
  switch (status) {
    case "completed":
      return <Badge variant="success"><CheckCircle2 />{label}</Badge>;
    case "separating":
      return <Badge variant="default"><Loader2 className="animate-spin" />{label}</Badge>;
    case "failed":
      return <Badge variant="destructive"><AlertCircle />{label}</Badge>;
    default:
      return <Badge variant="warning">{label}</Badge>;
  }
}
