import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { useT } from "@/i18n/useT.ts";

interface Props {
  readonly reason: string;
  readonly canBeRetried: boolean;
  readonly onRetry: () => void;
}

export function JobFailedCard({ reason, canBeRetried, onRetry }: Props) {
  const t = useT();
  return (
    <Card className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-red-300">
        <AlertTriangle className="size-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{t("job.failed")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
      </div>
      {canBeRetried && (
        <Button onClick={onRetry}>
          <RotateCcw />
          {t("job.retry")}
        </Button>
      )}
    </Card>
  );
}
