import { act } from "@testing-library/react";
import { useLocale } from "@/i18n/useT.ts";

export const chooseSpanish = (): void => act(() => useLocale.getState().setLocale("es"));
