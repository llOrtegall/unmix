import type { Credit as CreditValue } from "@/modules/track/domain/Credit.ts";

/** Licence credit, with its URL turned into a link. */
export function Credit({ credit }: { credit: CreditValue }) {
  const [before, url, after] = credit.toPrimitive().split(/(https?:\/\/\S+)/);
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {before}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
          {url.replace(/^https?:\/\//, "")}
        </a>
      )}
      {after}
    </p>
  );
}
