import { useEffect } from "react";

/** "<page> · unmix" while mounted; plain "unmix" otherwise. */
export function useDocumentTitle(page: string | undefined): void {
  useEffect(() => {
    document.title = page ? `${page} · unmix` : "unmix";
    return () => {
      document.title = "unmix";
    };
  }, [page]);
}
