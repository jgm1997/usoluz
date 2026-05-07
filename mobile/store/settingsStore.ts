import { create } from "zustand";
import i18n from "../i18n";

type Language = "en" | "es" | "ca";

interface SettingsStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  language: i18n.language as Language,
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
