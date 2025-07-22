import { useTranslation as useI18nTranslation } from "react-i18next";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { useTranslationPerformance } from "@/utils/translationPerformance";

// Type definitions for better type safety
type TranslationKey = string;
type TranslationOptions = {
  [key: string]: string | number;
};

export const useTranslation = (namespace?: string) => {
  const { t: originalT, i18n } = useI18nTranslation(namespace);
  const { startLoad, endLoad } = useTranslationPerformance(
    namespace || "common"
  );

  // Enhanced translation function with development logging and fallback
  const t = (
    key: TranslationKey,
    optionsOrDefault?: TranslationOptions | string
  ) => {
    // Check if the second parameter is a string (default value) or an object (options)
    let options: TranslationOptions | undefined;
    let defaultValue: string | undefined;

    if (typeof optionsOrDefault === "string") {
      defaultValue = optionsOrDefault;
    } else {
      options = optionsOrDefault;
    }

    const translation = originalT(key, options);

    // If translation is missing and we have a default value, use it
    if (translation === key && defaultValue) {
      return defaultValue;
    }

    // Log missing translations in development
    if (process.env.NODE_ENV === "development" && translation === key) {
      console.warn(`Missing translation for key: ${key}`);
    }

    return translation;
  };

  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      // Store language preference in localStorage
      localStorage.setItem("preferred-language", language);
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  };

  const currentLanguage = i18n.language;

  // Helper functions for date and number formatting
  const formatDate = (date: Date | string, formatStr: string = "PPP") => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const locale = currentLanguage === "it" ? it : enUS;
    return format(dateObj, formatStr, { locale });
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    const locale = currentLanguage === "it" ? "it-IT" : "en-US";
    return new Intl.NumberFormat(locale, options).format(number);
  };

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    const locale = currentLanguage === "it" ? "it-IT" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  };

  return {
    t,
    changeLanguage,
    currentLanguage,
    isItalian: currentLanguage === "it",
    isEnglish: currentLanguage === "en",
    formatDate,
    formatNumber,
    formatCurrency,
  };
};

export default useTranslation;
