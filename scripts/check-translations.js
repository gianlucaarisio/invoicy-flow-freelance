#!/usr/bin/env node

/**
 * Translation Consistency Checker
 * Checks for missing translations, inconsistencies, and validation issues
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

const LOCALES_DIR = "src/locales";

class TranslationChecker {
  constructor() {
    this.issues = [];
    this.languages = [];
    this.namespaces = new Set();
  }

  check() {
    console.log("🔍 Checking translation consistency...\n");

    try {
      const localesPath = resolve(LOCALES_DIR);
      this.languages = readdirSync(localesPath).filter((item) =>
        statSync(join(localesPath, item)).isDirectory()
      );

      console.log(`Found languages: ${this.languages.join(", ")}\n`);

      // Collect all namespaces
      this.collectNamespaces();

      // Check for missing files
      this.checkMissingFiles();

      // Check for missing keys
      this.checkMissingKeys();

      // Print results
      this.printResults();
    } catch (error) {
      console.error("❌ Error checking translations:", error.message);
      process.exit(1);
    }
  }

  collectNamespaces() {
    this.languages.forEach((lang) => {
      const langPath = join(LOCALES_DIR, lang);
      const files = readdirSync(langPath).filter((file) =>
        file.endsWith(".json")
      );
      files.forEach((file) => {
        this.namespaces.add(file.replace(".json", ""));
      });
    });
  }

  checkMissingFiles() {
    console.log("📁 Checking for missing translation files...");

    this.languages.forEach((lang) => {
      const langPath = join(LOCALES_DIR, lang);
      const existingFiles = new Set(
        readdirSync(langPath)
          .filter((file) => file.endsWith(".json"))
          .map((file) => file.replace(".json", ""))
      );

      this.namespaces.forEach((namespace) => {
        if (!existingFiles.has(namespace)) {
          this.issues.push({
            type: "missing-file",
            severity: "error",
            language: lang,
            namespace,
            message: `Missing translation file: ${lang}/${namespace}.json`,
          });
        }
      });
    });
  }

  checkMissingKeys() {
    console.log("🔑 Checking for missing translation keys...");

    // Use the first language as reference
    const referenceLang = this.languages[0];
    if (!referenceLang) return;

    this.namespaces.forEach((namespace) => {
      try {
        const refFilePath = join(
          LOCALES_DIR,
          referenceLang,
          `${namespace}.json`
        );
        if (!statSync(refFilePath).isFile()) return;

        const refContent = JSON.parse(readFileSync(refFilePath, "utf-8"));
        const refKeys = this.extractKeys(refContent);

        // Check other languages
        this.languages.slice(1).forEach((lang) => {
          const langFilePath = join(LOCALES_DIR, lang, `${namespace}.json`);

          try {
            const langContent = JSON.parse(readFileSync(langFilePath, "utf-8"));
            const langKeys = this.extractKeys(langContent);

            // Find missing keys
            refKeys.forEach((key) => {
              if (!langKeys.has(key)) {
                this.issues.push({
                  type: "missing-key",
                  severity: "warning",
                  language: lang,
                  namespace,
                  key,
                  message: `Missing translation key: ${key} in ${lang}/${namespace}.json`,
                });
              }
            });

            // Find extra keys
            langKeys.forEach((key) => {
              if (!refKeys.has(key)) {
                this.issues.push({
                  type: "extra-key",
                  severity: "info",
                  language: lang,
                  namespace,
                  key,
                  message: `Extra translation key: ${key} in ${lang}/${namespace}.json`,
                });
              }
            });
          } catch (error) {
            // File doesn't exist or is invalid JSON
            this.issues.push({
              type: "invalid-file",
              severity: "error",
              language: lang,
              namespace,
              message: `Invalid or missing file: ${lang}/${namespace}.json`,
            });
          }
        });
      } catch (error) {
        // Reference file doesn't exist or is invalid
        console.warn(
          `⚠️ Could not read reference file: ${referenceLang}/${namespace}.json`
        );
      }
    });
  }

  extractKeys(obj, prefix = "") {
    const keys = new Set();

    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === "object" && obj[key] !== null) {
        const nestedKeys = this.extractKeys(obj[key], fullKey);
        nestedKeys.forEach((nestedKey) => keys.add(nestedKey));
      } else {
        keys.add(fullKey);
      }
    }

    return keys;
  }

  printResults() {
    console.log("\n📊 Translation Check Results:\n");

    const errorCount = this.issues.filter(
      (issue) => issue.severity === "error"
    ).length;
    const warningCount = this.issues.filter(
      (issue) => issue.severity === "warning"
    ).length;
    const infoCount = this.issues.filter(
      (issue) => issue.severity === "info"
    ).length;

    console.log(`Total Issues: ${this.issues.length}`);
    console.log(`🔴 Errors: ${errorCount}`);
    console.log(`🟡 Warnings: ${warningCount}`);
    console.log(`🔵 Info: ${infoCount}\n`);

    if (this.issues.length === 0) {
      console.log("✅ No translation issues found!\n");
      return;
    }

    // Group issues by type
    const groupedIssues = this.issues.reduce((groups, issue) => {
      if (!groups[issue.type]) {
        groups[issue.type] = [];
      }
      groups[issue.type].push(issue);
      return groups;
    }, {});

    Object.entries(groupedIssues).forEach(([type, issues]) => {
      const icon =
        issues[0].severity === "error"
          ? "🔴"
          : issues[0].severity === "warning"
          ? "🟡"
          : "🔵";

      console.log(
        `${icon} ${type.toUpperCase().replace("-", " ")} (${issues.length}):`
      );

      issues.slice(0, 10).forEach((issue) => {
        console.log(`  • ${issue.message}`);
      });

      if (issues.length > 10) {
        console.log(`  ... and ${issues.length - 10} more`);
      }

      console.log("");
    });

    // Exit with error code if there are errors
    if (errorCount > 0) {
      process.exit(1);
    }
  }
}

// Run checker
const checker = new TranslationChecker();
checker.check();
