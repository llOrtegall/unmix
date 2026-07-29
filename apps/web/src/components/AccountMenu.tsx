import { LogOut } from "lucide-react";
import { useSession } from "@/hooks/useSession.ts";
import { useT } from "@/i18n/useT.ts";

export function AccountMenu() {
  const state = useSession((store) => store.state);
  const signOut = useSession((store) => store.signOut);
  const t = useT();
  if (state.status !== "signed-in") return null;
  const name = state.user.getName();
  const email = state.user.getEmail().toPrimitive();
  const avatar = state.user.getAvatarUrl();
  return (
    <div className="flex items-center gap-1">
      <span
        title={`${name.toPrimitive()} · ${email}`}
        className="flex size-8 items-center justify-center overflow-hidden rounded-full border bg-secondary text-xs font-medium uppercase"
      >
        {avatar ? <img src={avatar.toPrimitive()} alt="" referrerPolicy="no-referrer" className="size-full object-cover" /> : name.initial()}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        title={t("auth.signOut")}
        aria-label={t("auth.signOut")}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
