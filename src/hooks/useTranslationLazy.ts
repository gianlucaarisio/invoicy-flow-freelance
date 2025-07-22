import { useTranslation as useI18nTranslation } from "react-i18next";
import { useEffect, useState, useCallback, useRef } from "react";
import { loadNamespace, preloadTranslations } from "@/i18n/config";

interface UseTranslationLazyOptions {
  keyPrefix?: string;
  useSuspense?: boolean;
  enablePerformanceTracking?: boolean;
}

interface UseTranslationLazyReturn {
  t: (key: string, options?: any) => string;
  i18n: any;
  ready: boolean;
  loading: boolean;
  error: Error | null;
  loadTime: number;
  refresh: () => Promise<void>;
}

/**
 * Enhanced useTranslation hook with lazy loading support and performance tracking
 * Automatically loads namespaces when needed and provides loading states
 */
export const useTranslationLazy = (
  namespace: string | string[],
  options: UseTranslationLazyOptions = {}
): UseTranslationLazyReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadTime, setLoadTime] = useState<number>(0);
  const loadStartTime = useRef<number>(0);

  const {
    enablePerformanceTracking = process.env.NODE_ENV === "development",
    ...i18nOptions
  } = options;

  const namespaces = Array.isArray(namespace) ? namespace : [namespace];

  // Use the standard hook
  const { t, i18n, ready } = useI18nTranslation(namespaces, {
    useSuspense: false,
    ...i18nOptions,
  });

  const loadNamespaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    loadStartTime.current = performance.now();

    try {
      await Promise.all(namespaces.map((ns) => loadNamespace(ns)));

      const endTime = performance.now();
      const totalLoadTime = endTime - loadStartTime.current;
      setLoadTime(totalLoadTime);

      if (enablePerformanceTracking) {
        console.log(
          `📦 Loaded namespaces [${namespaces.join(
            ", "
          )}] in ${totalLoadTime.toFixed(2)}ms`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load translations")
      );

      if (enablePerformanceTracking) {
        console.error(
          `❌ Failed to load namespaces [${namespaces.join(", ")}]:`,
          err
        );
      }
    } finally {
      setLoading(false);
    }
  }, [namespaces, enablePerformanceTracking]);

  const refresh = useCallback(async () => {
    await loadNamespaces();
  }, [loadNamespaces]);

  useEffect(() => {
    // Only load if not already loaded
    const needsLoading = namespaces.some(
      (ns) => !i18n.hasResourceBundle(i18n.language, ns)
    );

    if (needsLoading) {
      loadNamespaces();
    }
  }, [namespaces, i18n, loadNamespaces]);

  return {
    t,
    i18n,
    ready: ready && !loading,
    loading,
    error,
    loadTime,
    refresh,
  };
};

/**
 * Hook for preloading namespaces without using them immediately
 * Useful for prefetching translations for routes or components
 * Enhanced with performance tracking and error handling
 */
export const usePreloadTranslations = (
  namespaces: string[],
  options: {
    languages?: string[];
    enableTracking?: boolean;
    delay?: number;
  } = {}
) => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState<Error | null>(null);
  const [preloadTime, setPreloadTime] = useState<number>(0);

  const {
    languages = ["it", "en"],
    enableTracking = process.env.NODE_ENV === "development",
    delay = 0,
  } = options;

  useEffect(() => {
    const preload = async () => {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      setIsPreloading(true);
      setPreloadError(null);
      const startTime = performance.now();

      try {
        await preloadTranslations(namespaces, languages);

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        setPreloadTime(totalTime);

        if (enableTracking) {
          console.log(
            `🚀 Preloaded namespaces [${namespaces.join(
              ", "
            )}] for languages [${languages.join(", ")}] in ${totalTime.toFixed(
              2
            )}ms`
          );
        }
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error("Preload failed");
        setPreloadError(err);

        if (enableTracking) {
          console.warn("Failed to preload translations:", error);
        }
      } finally {
        setIsPreloading(false);
      }
    };

    preload();
  }, [namespaces, languages, enableTracking, delay]);

  return {
    isPreloading,
    preloadError,
    preloadTime,
  };
};

/**
 * Hook for route-based translation preloading
 * Automatically preloads translations based on route patterns
 */
export const useRouteTranslations = (routePath: string) => {
  const getNamespacesForRoute = useCallback((path: string): string[] => {
    const routeNamespaceMap: Record<string, string[]> = {
      "/login": ["auth", "forms", "errors"],
      "/register": ["auth", "forms", "errors"],
      "/dashboard": ["dashboard", "common"],
      "/documents": ["documents", "common", "forms"],
      "/clients": ["clients", "common", "forms"],
      "/items": ["items", "common", "forms"],
    };

    // Find matching route pattern
    for (const [pattern, namespaces] of Object.entries(routeNamespaceMap)) {
      if (path.startsWith(pattern)) {
        return namespaces;
      }
    }

    return ["common"]; // Default fallback
  }, []);

  const namespaces = getNamespacesForRoute(routePath);

  return usePreloadTranslations(namespaces, {
    delay: 100, // Small delay to avoid blocking initial render
  });
};
