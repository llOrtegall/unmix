import { useState } from "react";
import { GoogleLogo } from "@/components/GoogleLogo.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useSession } from "@/hooks/useSession.ts";
import { useErrorMessage } from "@/i18n/errorMessages.ts";
import { useT } from "@/i18n/useT.ts";
import type { DomainError } from "@/modules/shared/domain/DomainError.ts";

export function SignInPage({ error }: { error: DomainError | null }) {
  const t = useT();
  const messageFor = useErrorMessage();
  const signIn = useSession((store) => store.signIn);
  const [isBusy, setIsBusy] = useState(false);

  return (
    <div className="flex justify-center pt-10 sm:pt-20">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">{t("auth.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.subtitle")}</p>
        <Button
          size="lg"
          variant="outline"
          className="mt-6 w-full"
          disabled={isBusy}
          onClick={() => {
            setIsBusy(true);
            void signIn().finally(() => setIsBusy(false));
          }}
        >
          <GoogleLogo />
          {t("auth.google")}
        </Button>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {messageFor(error)}
          </p>
        )}
      </div>
    </div>
  );
}
