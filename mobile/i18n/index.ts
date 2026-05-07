import en from "./locales/en";
import es from "./locales/es";
import ca from "./locales/ca";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: { translation: en },
  es: { translation: es },
  ca: { translation: ca },
};

function getDefaultLanguage(): string {
  const locale = Localization.getLocales()[0]?.languageCode ?? "en";
  return locale in resources ? locale : "en";
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDefaultLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
