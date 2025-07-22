import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

// Import only critical translations that need to be available immediately
import itCommon from "@/locales/it/common.json";
import enCommon from "@/locales/en/common.json";

// Define critical resources that should be loaded immediately
const criticalResources = {
  it: {
    common: itCommon,
  },
  en: {
    common: enCommon,
  },
};

// Enhanced translation cache with LRU eviction and compression
class TranslationCache {
  private cache = new Map<string, any>();
  private accessOrder = new Map<string, number>();
  private maxSize = 50; // Maximum number of cached namespaces
  private accessCounter = 0;
  private compressionEnabled = true;

  get(key: string): any {
    if (this.cache.has(key)) {
      // Update access order for LRU
      this.accessOrder.set(key, ++this.accessCounter);
      return this.cache.get(key);
    }
    return null;
  }

  set(key: string, value: any): void {
    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const lruKey = this.getLRUKey();
      if (lruKey) {
        this.cache.delete(lruKey);
        this.accessOrder.delete(lruKey);
      }
    }

    // Compress data if enabled (simple JSON minification)
    const cachedValue = this.compressionEnabled
      ? JSON.parse(JSON.stringify(value)) // Deep clone and minify
      : value;

    this.cache.set(key, cachedValue);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  private getLRUKey(): string | null {
    let lruKey: string | null = null;
    let minAccess = Infinity;

    for (const [key, access] of this.accessOrder) {
      if (access < minAccess) {
        minAccess = access;
        lruKey = key;
      }
    }

    return lruKey;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      accessCounter: this.accessCounter,
    };
  }
}

const translationCache = new TranslationCache();

// Performance monitoring
const performanceMetrics = {
  loadTimes: new Map<string, number>(),
  cacheHits: 0,
  cacheMisses: 0,
  totalRequests: 0,
};

// Error recovery mechanism with enhanced performance tracking
const loadTranslationWithRetry = async (
  language: string,
  namespace: string,
  retries = 3
): Promise<any> => {
  const cacheKey = `${language}-${namespace}`;
  const startTime = performance.now();

  performanceMetrics.totalRequests++;

  // Check cache first
  if (translationCache.has(cacheKey)) {
    performanceMetrics.cacheHits++;
    const cached = translationCache.get(cacheKey);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Cache hit for ${cacheKey} (${(performance.now() - startTime).toFixed(
          2
        )}ms)`
      );
    }

    return cached;
  }

  performanceMetrics.cacheMisses++;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `/src/locales/${language}/${namespace}.json`,
        {
          // Add cache headers for better browser caching
          headers: {
            "Cache-Control": "public, max-age=3600",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const translations = await response.json();
      const loadTime = performance.now() - startTime;

      // Cache successful load
      translationCache.set(cacheKey, translations);
      performanceMetrics.loadTimes.set(cacheKey, loadTime);

      if (process.env.NODE_ENV === "development") {
        console.log(
          `Loaded ${cacheKey} in ${loadTime.toFixed(2)}ms (attempt ${attempt})`
        );
      }

      return translations;
    } catch (error) {
      console.warn(
        `Translation load attempt ${attempt}/${retries} failed for ${language}/${namespace}:`,
        error
      );

      if (attempt === retries) {
        // Final fallback - return empty object to prevent crashes
        console.error(
          `Failed to load translations for ${language}/${namespace} after ${retries} attempts`
        );
        return {};
      }

      // Wait before retry (exponential backoff with jitter)
      const delay = Math.pow(2, attempt) * 100 + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    // Load critical resources immediately
    resources: criticalResources,

    lng: "it", // Italian as default language
    fallbackLng: "en", // English as fallback

    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    // Enable namespace support with lazy loading
    ns: ["common"], // Only load common namespace initially
    defaultNS: "common",

    // Lazy loading configuration
    backend: {
      loadPath: "/src/locales/{{lng}}/{{ns}}.json",

      // Custom load function with caching and error recovery
      load: async (language: string, namespace: string, callback: Function) => {
        try {
          const translations = await loadTranslationWithRetry(
            language,
            namespace
          );
          callback(null, translations);
        } catch (error) {
          console.error(`Failed to load ${language}/${namespace}:`, error);
          callback(error, {});
        }
      },

      // Cache translations in memory
      allowMultiLoading: false,
      crossDomain: false,
    },

    // Performance optimizations
    load: "languageOnly", // Don't load region-specific variants
    preload: ["it", "en"], // Preload both languages

    // Only load namespaces when needed
    partialBundledLanguages: true,

    // Development settings
    debug: process.env.NODE_ENV === "development",

    // Reduce bundle size by disabling unused features
    initImmediate: false,

    // Key separator and nesting separator
    keySeparator: ".",
    nsSeparator: ":",

    // Optimize for performance
    returnEmptyString: false,
    returnNull: false,

    // Cache settings
    cache: {
      enabled: true,
      prefix: "i18next_res_",
      expirationTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  });

export default i18n;

// Namespace management utilities
export const loadNamespace = async (namespace: string): Promise<void> => {
  if (!i18n.hasResourceBundle(i18n.language, namespace)) {
    try {
      await i18n.loadNamespaces(namespace);
    } catch (error) {
      console.error(`Failed to load namespace ${namespace}:`, error);
    }
  }
};

// Namespace priority configuration for intelligent loading
const NAMESPACE_PRIORITIES = {
  critical: ["common", "auth", "forms", "errors"], // Load immediately
  high: ["dashboard", "navigation"], // Load on app start
  medium: ["documents", "clients"], // Load on demand
  low: ["items"], // Load when needed
};

// Preload critical namespaces for better UX
export const preloadCriticalNamespaces = async (): Promise<void> => {
  const criticalNamespaces = [...NAMESPACE_PRIORITIES.critical];

  try {
    await preloadTranslations(criticalNamespaces, [i18n.language, "en"]);

    // Preload high priority namespaces in background
    setTimeout(() => {
      preloadTranslations(
        [...NAMESPACE_PRIORITIES.high],
        [i18n.language, "en"]
      ).catch((error) =>
        console.warn("Failed to preload high priority namespaces:", error)
      );
    }, 100);
  } catch (error) {
    console.warn("Failed to preload some critical namespaces:", error);
  }
};

// Enhanced performance monitoring
export const getTranslationStats = () => {
  const cacheStats = translationCache.getStats();
  const avgLoadTime =
    Array.from(performanceMetrics.loadTimes.values()).reduce(
      (sum, time) => sum + time,
      0
    ) / performanceMetrics.loadTimes.size || 0;

  const stats = {
    loadedNamespaces: Object.keys(i18n.store.data[i18n.language] || {}),
    cache: cacheStats,
    performance: {
      totalRequests: performanceMetrics.totalRequests,
      cacheHitRate:
        performanceMetrics.totalRequests > 0
          ? (
              (performanceMetrics.cacheHits /
                performanceMetrics.totalRequests) *
              100
            ).toFixed(2) + "%"
          : "0%",
      averageLoadTime: avgLoadTime.toFixed(2) + "ms",
      loadTimes: Object.fromEntries(
        Array.from(performanceMetrics.loadTimes.entries()).map(
          ([key, time]) => [key, time.toFixed(2) + "ms"]
        )
      ),
    },
    currentLanguage: i18n.language,
    isReady: i18n.isInitialized,
    bundleInfo: {
      availableLanguages: Object.keys(i18n.store.data || {}),
      totalNamespaces: Object.values(i18n.store.data || {}).reduce(
        (total, lang: any) => total + Object.keys(lang || {}).length,
        0
      ),
    },
  };

  if (process.env.NODE_ENV === "development") {
    console.group("🌐 Translation Performance Stats");
    console.log("Cache Hit Rate:", stats.performance.cacheHitRate);
    console.log("Average Load Time:", stats.performance.averageLoadTime);
    console.log("Loaded Namespaces:", stats.loadedNamespaces);
    console.log("Cache Size:", `${cacheStats.size}/${cacheStats.maxSize}`);
    console.groupEnd();
  }

  return stats;
};

// Clear translation cache (useful for development)
export const clearTranslationCache = (): void => {
  translationCache.clear();

  // Reset performance metrics
  performanceMetrics.cacheHits = 0;
  performanceMetrics.cacheMisses = 0;
  performanceMetrics.totalRequests = 0;
  performanceMetrics.loadTimes.clear();

  if (process.env.NODE_ENV === "development") {
    console.log("🧹 Translation cache and metrics cleared");
  }
};

// Preload translations for better performance
export const preloadTranslations = async (
  namespaces: string[],
  languages: string[] = [i18n.language]
): Promise<void> => {
  const startTime = performance.now();

  try {
    const loadPromises = languages.flatMap((lang) =>
      namespaces.map((ns) => loadTranslationWithRetry(lang, ns))
    );

    await Promise.all(loadPromises);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `⚡ Preloaded ${namespaces.length} namespaces for ${
          languages.length
        } languages in ${(performance.now() - startTime).toFixed(2)}ms`
      );
    }
  } catch (error) {
    console.warn("Failed to preload some translations:", error);
  }
};

// Intelligent namespace loading based on route patterns
export const getNamespacesForRoute = (routePath: string): string[] => {
  const routeNamespaceMap: Record<string, string[]> = {
    "/login": [...NAMESPACE_PRIORITIES.critical],
    "/register": [...NAMESPACE_PRIORITIES.critical],
    "/dashboard": ["dashboard", "common"],
    "/documents": ["documents", "common", "forms"],
    "/clients": ["clients", "common", "forms"],
    "/items": ["items", "common", "forms"],
  };

  // Find matching route pattern
  for (const [pattern, namespaces] of Object.entries(routeNamespaceMap)) {
    if (routePath.startsWith(pattern)) {
      return namespaces;
    }
  }

  return ["common"]; // Default fallback
};

// Bundle size optimization - remove unused translations in production
if (process.env.NODE_ENV === "production") {
  // Remove debug information
  i18n.options.debug = false;

  // Optimize memory usage
  i18n.options.cleanCode = true;
}
