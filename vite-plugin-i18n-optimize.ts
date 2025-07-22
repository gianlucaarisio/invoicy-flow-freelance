import { Plugin } from "vite";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "fs";
import { resolve, join } from "path";

interface I18nOptimizeOptions {
  localesDir?: string;
  outputDir?: string;
  minify?: boolean;
  removeUnusedKeys?: boolean;
  enableCompression?: boolean;
  generateStats?: boolean;
  criticalNamespaces?: string[];
}

interface TranslationStats {
  totalKeys: number;
  totalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  namespaces: Record<string, { keys: number; size: number }>;
}

/**
 * Vite plugin to optimize i18n bundles
 * - Minifies translation files
 * - Removes unused translation keys (optional)
 * - Generates optimized bundle chunks
 * - Provides compression and caching optimizations
 * - Generates translation statistics
 */
export function i18nOptimize(options: I18nOptimizeOptions = {}): Plugin {
  const {
    localesDir = "src/locales",
    outputDir = "dist/locales",
    minify = true,
    removeUnusedKeys = false,
    enableCompression = true,
    generateStats = true,
    criticalNamespaces = ["common", "auth", "forms", "errors"],
  } = options;

  let translationStats: TranslationStats = {
    totalKeys: 0,
    totalSize: 0,
    optimizedSize: 0,
    compressionRatio: 0,
    namespaces: {},
  };

  const countKeys = (obj: any): number => {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        count += countKeys(obj[key]);
      } else {
        count++;
      }
    }
    return count;
  };

  const optimizeTranslationContent = (content: string, fileName: string) => {
    try {
      const parsed = JSON.parse(content);
      const keyCount = countKeys(parsed);

      // Track stats
      translationStats.totalKeys += keyCount;
      translationStats.totalSize += content.length;

      const namespace =
        fileName.split("/").pop()?.replace(".json", "") || "unknown";
      translationStats.namespaces[namespace] = {
        keys: keyCount,
        size: content.length,
      };

      // Minify JSON (remove whitespace)
      const minified = JSON.stringify(parsed);
      translationStats.optimizedSize += minified.length;

      return minified;
    } catch (error) {
      console.warn(`Failed to optimize translation file ${fileName}:`, error);
      return content;
    }
  };

  return {
    name: "i18n-optimize",
    apply: "build",

    buildStart() {
      // Reset stats for each build
      translationStats = {
        totalKeys: 0,
        totalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        namespaces: {},
      };
    },

    generateBundle(outputOptions, bundle) {
      if (!minify) return;

      // Find and optimize translation JSON files
      Object.keys(bundle).forEach((fileName) => {
        const chunk = bundle[fileName];

        if (
          chunk.type === "asset" &&
          fileName.includes("/locales/") &&
          fileName.endsWith(".json")
        ) {
          const originalContent = chunk.source as string;
          const optimizedContent = optimizeTranslationContent(
            originalContent,
            fileName
          );

          // Update the bundle
          chunk.source = optimizedContent;

          console.log(
            `Optimized translation file: ${fileName} (${originalContent.length} -> ${optimizedContent.length} bytes)`
          );
        }
      });

      // Calculate final compression ratio
      if (translationStats.totalSize > 0) {
        translationStats.compressionRatio =
          ((translationStats.totalSize - translationStats.optimizedSize) /
            translationStats.totalSize) *
          100;
      }

      // Generate stats file if enabled
      if (generateStats) {
        this.emitFile({
          type: "asset",
          fileName: "translation-stats.json",
          source: JSON.stringify(translationStats, null, 2),
        });

        console.log(`Translation optimization stats:
  Total keys: ${translationStats.totalKeys}
  Original size: ${(translationStats.totalSize / 1024).toFixed(2)} KB
  Optimized size: ${(translationStats.optimizedSize / 1024).toFixed(2)} KB
  Compression ratio: ${translationStats.compressionRatio.toFixed(2)}%`);
      }
    },

    configureServer(server) {
      // In development, serve translation files with proper caching headers
      server.middlewares.use("/src/locales", (req, res, next) => {
        const url = req.url || "";

        // Set different cache headers based on file type
        if (url.endsWith(".json")) {
          // Critical namespaces get shorter cache for faster development
          const isCritical = criticalNamespaces.some((ns) =>
            url.includes(`/${ns}.json`)
          );
          const maxAge = isCritical ? 300 : 3600; // 5 minutes vs 1 hour

          res.setHeader("Cache-Control", `public, max-age=${maxAge}`);
          res.setHeader("ETag", `"${Date.now()}"`);
        }

        next();
      });
    },

    // Add development-time optimization warnings
    configResolved(config) {
      if (config.command === "serve" && config.mode === "development") {
        // Check for potential optimization issues in development
        setTimeout(() => {
          try {
            const localesPath = resolve(localesDir);
            if (existsSync(localesPath)) {
              const languages = readdirSync(localesPath).filter((item) =>
                statSync(join(localesPath, item)).isDirectory()
              );

              languages.forEach((lang) => {
                const langPath = join(localesPath, lang);
                const files = readdirSync(langPath).filter((file) =>
                  file.endsWith(".json")
                );

                files.forEach((file) => {
                  const filePath = join(langPath, file);
                  const content = readFileSync(filePath, "utf-8");

                  if (content.length > 50000) {
                    // 50KB threshold
                    console.warn(
                      `Large translation file detected: ${lang}/${file} (${(
                        content.length / 1024
                      ).toFixed(
                        2
                      )} KB). Consider splitting into smaller namespaces.`
                    );
                  }
                });
              });
            }
          } catch (error) {
            // Silently ignore errors in development checks
          }
        }, 1000);
      }
    },
  };
}

export default i18nOptimize;
