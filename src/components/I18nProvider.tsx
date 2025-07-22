import React, { Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { getTranslationStats } from "@/i18n/config";
import { TranslationLoader } from "./TranslationLoader";

interface I18nProviderProps {
  children: React.ReactNode;
  showLoadingState?: boolean;
  fallback?: React.ReactNode;
}

export function I18nProvider({
  children,
  showLoadingState = true,
  fallback,
}: I18nProviderProps) {
  // Log translation stats in development
  if (process.env.NODE_ENV === "development") {
    React.useEffect(() => {
      const timer = setTimeout(() => {
        getTranslationStats();
      }, 1000);
      return () => clearTimeout(timer);
    }, []);
  }

  return (
    <I18nextProvider i18n={i18n}>
      <Suspense
        fallback={
          fallback || (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )
        }
      >
        <TranslationLoader
          showLoadingState={showLoadingState}
          fallback={fallback}
        >
          {children}
        </TranslationLoader>
      </Suspense>
    </I18nextProvider>
  );
}

export default I18nProvider;
