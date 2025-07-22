#!/usr/bin/env node

/**
 * Translation Performance Analysis Script
 * Analyzes translation files for performance optimization opportunities
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const LOCALES_DIR = "src/locales";
const OUTPUT_FILE = "translation-analysis.json";

class TranslationAnalyzer {
  constructor() {
    this.results = {
      summary: {},
      files: {},
      recommendations: [],
      performance: {
        totalSize: 0,
        totalKeys: 0,
        largeFiles: [],
        duplicateKeys: [],
        unusedKeys: [],
      },
    };
  }

  analyze() {
    console.log("🔍 Analyzing translation files...\n");

    try {
      const localesPath = resolve(LOCALES_DIR);
      const languages = readdirSync(localesPath).filter((item) =>
        statSync(join(localesPath, item)).isDirectory()
      );

      console.log(`Found languages: ${languages.join(", ")}\n`);

      languages.forEach((lang) => {
        this.analyzeLanguage(lang);
      });

      this.generateRecommendations();
      this.printResults();
      this.saveResults();
    } catch (error) {
      console.error("❌ Error analyzing translations:", error.message);
      process.exit(1);
    }
  }

  analyzeLanguage(language) {
    const langPath = join(LOCALES_DIR, language);
    const files = readdirSync(langPath).filter((file) =>
      file.endsWith(".json")
    );

    console.log(`📁 Analyzing ${language}:`);

    const langData = {
      totalSize: 0,
      totalKeys: 0,
      files: {},
    };

    files.forEach((file) => {
      const filePath = join(langPath, file);
      const content = readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);

      const fileStats = this.analyzeFile(data, content.length);
      langData.files[file] = fileStats;
      langData.totalSize += fileStats.size;
      langData.totalKeys += fileStats.keyCount;

      console.log(
        `  📄 ${file}: ${fileStats.keyCount} keys, ${(
          fileStats.size / 1024
        ).toFixed(2)} KB`
      );

      // Track large files
      if (fileStats.size > 50000) {
        // 50KB threshold
        this.results.performance.largeFiles.push({
          language,
          file,
          size: fileStats.size,
          keys: fileStats.keyCount,
        });
      }
    });

    this.results.files[language] = langData;
    this.results.performance.totalSize += langData.totalSize;
    this.results.performance.totalKeys += langData.totalKeys;

    console.log(
      `  📊 Total: ${langData.totalKeys} keys, ${(
        langData.totalSize / 1024
      ).toFixed(2)} KB\n`
    );
  }

  analyzeFile(data, size) {
    const keyCount = this.countKeys(data);
    const depth = this.getMaxDepth(data);
    const avgKeyLength = this.getAverageKeyLength(data);

    return {
      size,
      keyCount,
      depth,
      avgKeyLength,
      estimatedMinified: JSON.stringify(data).length,
      compressionRatio:
        (((size - JSON.stringify(data).length) / size) * 100).toFixed(2) + "%",
    };
  }

  countKeys(obj, prefix = "") {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        count += this.countKeys(obj[key], prefix + key + ".");
      } else {
        count++;
      }
    }
    return count;
  }

  getMaxDepth(obj, currentDepth = 0) {
    let maxDepth = currentDepth;
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        const depth = this.getMaxDepth(obj[key], currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }
    return maxDepth;
  }

  getAverageKeyLength(obj, keys = []) {
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        this.getAverageKeyLength(obj[key], keys);
      } else {
        keys.push(obj[key].length);
      }
    }
    return keys.length > 0
      ? keys.reduce((sum, len) => sum + len, 0) / keys.length
      : 0;
  }

  generateRecommendations() {
    const recommendations = [];

    // Large file recommendations
    if (this.results.performance.largeFiles.length > 0) {
      recommendations.push({
        type: "performance",
        priority: "high",
        title: "Large Translation Files Detected",
        description: `${this.results.performance.largeFiles.length} files exceed 50KB. Consider splitting into smaller namespaces.`,
        files: this.results.performance.largeFiles.map(
          (f) => `${f.language}/${f.file}`
        ),
      });
    }

    // Bundle size recommendations
    const totalSizeMB = this.results.performance.totalSize / (1024 * 1024);
    if (totalSizeMB > 1) {
      recommendations.push({
        type: "bundle-size",
        priority: "medium",
        title: "Large Translation Bundle",
        description: `Total translation size is ${totalSizeMB.toFixed(
          2
        )}MB. Consider lazy loading non-critical namespaces.`,
      });
    }

    // Key count recommendations
    if (this.results.performance.totalKeys > 1000) {
      recommendations.push({
        type: "organization",
        priority: "low",
        title: "High Key Count",
        description: `${this.results.performance.totalKeys} total translation keys. Consider reviewing for unused keys.`,
      });
    }

    this.results.recommendations = recommendations;
  }

  printResults() {
    console.log("📊 Analysis Results:\n");

    console.log(
      `Total Size: ${(this.results.performance.totalSize / 1024).toFixed(2)} KB`
    );
    console.log(`Total Keys: ${this.results.performance.totalKeys}`);
    console.log(`Languages: ${Object.keys(this.results.files).length}\n`);

    if (this.results.recommendations.length > 0) {
      console.log("💡 Recommendations:\n");
      this.results.recommendations.forEach((rec, index) => {
        const priority =
          rec.priority === "high"
            ? "🔴"
            : rec.priority === "medium"
            ? "🟡"
            : "🟢";
        console.log(`${index + 1}. ${priority} ${rec.title}`);
        console.log(`   ${rec.description}`);
        if (rec.files) {
          console.log(`   Files: ${rec.files.join(", ")}`);
        }
        console.log("");
      });
    } else {
      console.log("✅ No performance issues detected!\n");
    }
  }

  saveResults() {
    writeFileSync(OUTPUT_FILE, JSON.stringify(this.results, null, 2));
    console.log(`📁 Detailed analysis saved to ${OUTPUT_FILE}`);
  }
}

// Run analysis
const analyzer = new TranslationAnalyzer();
analyzer.analyze();
