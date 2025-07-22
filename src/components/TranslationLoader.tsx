import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { preloadCriticalNamespaces, getTranslationStats } from "@/i18n/config";

interface TranslationLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoadingState?: boolean;
  enablePerformanceMonitoring?: boolean;
}

/**
 * Component that ensures critical translations are loaded before rendering children
 * Provides loading states and error boundaries for translation loading
 * Enhanced with performance monitoring and optimization
 */
export const TranslationLoader = ({
  children,
  fallback,
  showLoadingState = true,
  enablePerformanceMonitoring = process.env.NODE_ENV === "development",
}: TranslationLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loadTime, setLoadTime] = useState<number>(0);
  const { ready } = useTranslation();

  useEffect(() => {
    const loadTranslations = async () => {
      const startTime = performance.now();

      try {
        await preloadCriticalNamespaces();
        const endTime = performance.now();
        const totalLoadTime = endTime - startTime;

        setLoadTime(totalLoadTime);
        setIsLoading(false);

        if (enablePerformanceMonitoring) {
          console.log(
            `🚀 Critical translations loaded in ${totalLoadTime.toFixed(2)}ms`
          );

          // Log detailed stats after a short delay to ensure all loading is complete
          setTimeout(() => {
            getTranslationStats();
          }, 100);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load translations")
        );
        setIsLoading(false);

        if (enablePerformanceMonitoring) {
          console.error("❌ Translation loading failed:", err);
        }
      }
    };

    if (ready) {
      loadTranslations();
    }
  }, [ready, enablePerformanceMonitoring]);

  // Performance warning for slow loading
  useEffect(() => {
    if (!isLoading && loadTime > 1000 && enablePerformanceMonitoring) {
      console.warn(
        `⚠️ Slow translation loading detected: ${loadTime.toFixed(
          2
        )}ms. Consider optimizing critical namespaces.`
      );
    }
  }, [isLoading, loadTime, enablePerformanceMonitoring]);

  if (error) {
    console.error("Translation loading error:", error);
    // Still render children even if some translations failed to load
    return <>{children}</>;
  }

  if (isLoading && showLoadingState) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            {enablePerformanceMonitoring && (
              <div className="text-sm text-muted-foreground">
                Loading translations...
              </div>
            )}
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};

/**
 * Higher-order component for wrapping components that need specific namespaces
 */
export const withTranslationNamespace = (
  Component: React.ComponentType<any>,
  namespaces: string[]
) => {
  return function WrappedComponent(props: any) {
    const [namespacesLoaded, setNamespacesLoaded] = useState(false);
    const { i18n } = useTranslation();

    useEffect(() => {
      const loadNamespaces = async () => {
        try {
          await i18n.loadNamespaces(namespaces);
          setNamespacesLoaded(true);
        } catch (error) {
          console.warn("Failed to load namespaces:", namespaces, error);
          setNamespacesLoaded(true); // Still render component
        }
      };

      const allLoaded = namespaces.every((ns) =>
        i18n.hasResourceBundle(i18n.language, ns)
      );

      if (allLoaded) {
        setNamespacesLoaded(true);
      } else {
        loadNamespaces();
      }
    }, [i18n]);

    if (!namespacesLoaded) {
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};
