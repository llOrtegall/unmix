import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { useT } from "@/i18n/useT.ts";
import type { TrackStatus } from "@/modules/track/domain/TrackStatus.ts";

export function StatusBadge({ status }: { status: TrackStatus }) {
  const t = useT();
  const value = status.toPrimitive();
  const label = t(`status.${value}`);
  switch (value) {
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
