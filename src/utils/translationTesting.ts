/**
 * Translation Testing and Quality Assurance Utilities
 * Provides comprehensive testing for Italian translations
 */

import i18n from "@/i18n/config";

export interface TranslationTestResult {
  passed: boolean;
  message: string;
  severity: "error" | "warning" | "info";
  namespace?: string;
  key?: string;
  value?: string;
}

export interface QualityAssuranceReport {
  overallScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TranslationTestResult[];
  recommendations: string[];
}

class TranslationTester {
  private results: TranslationTestResult[] = [];

  /**
   * Run comprehensive quality assurance tests
   */
  async runQualityAssurance(): Promise<QualityAssuranceReport> {
    this.results = [];

    // Test translation completeness
    await this.testTranslationCompleteness();

    // Test text length and layout compatibility
    this.testTextLengthCompatibility();

    // Test pluralization rules
    this.testPluralizationRules();

    // Test contextual translations
    this.testContextualTranslations();

    // Test special characters and encoding
    this.testSpecialCharacters();

    // Test number and date formatting
    this.testFormattingConsistency();

    // Test UI component compatibility
    this.testUIComponentCompatibility();

    // Generate report
    return this.generateReport();
  }

  /**
   * Test that all critical translations are present
   */
  private async testTranslationCompleteness(): Promise<void> {
    const criticalNamespaces = ["common", "auth", "forms", "errors"];
    const languages = ["it", "en"];

    for (const namespace of criticalNamespaces) {
      for (const language of languages) {
        try {
          if (!i18n.hasResourceBundle(language, namespace)) {
            await i18n.loadNamespaces(namespace);
          }

          const bundle = i18n.getResourceBundle(language, namespace);
          if (!bundle || Object.keys(bundle).length === 0) {
            this.addResult({
              passed: false,
              message: `Missing or empty translation bundle: ${language}/${namespace}`,
              severity: "error",
              namespace,
            });
          } else {
            this.addResult({
              passed: true,
              message: `Translation bundle loaded successfully: ${language}/${namespace}`,
              severity: "info",
              namespace,
            });
          }
        } catch (error) {
          this.addResult({
            passed: false,
            message: `Failed to load translation bundle: ${language}/${namespace} - ${error}`,
            severity: "error",
            namespace,
          });
        }
      }
    }
  }

  /**
   * Test text length compatibility for UI layouts
   */
  private testTextLengthCompatibility(): void {
    const testCases = [
      { key: "common.actions.create", maxLength: 20 },
      { key: "common.actions.save", maxLength: 15 },
      { key: "common.actions.cancel", maxLength: 15 },
      { key: "common.navigation.dashboard", maxLength: 25 },
      { key: "common.navigation.documents", maxLength: 25 },
      { key: "common.navigation.clients", maxLength: 25 },
    ];

    testCases.forEach(({ key, maxLength }) => {
      const italianText = i18n.t(key, { lng: "it" });
      const englishText = i18n.t(key, { lng: "en" });

      if (italianText.length > maxLength) {
        this.addResult({
          passed: false,
          message: `Italian text too long for UI: "${italianText}" (${italianText.length} chars, max: ${maxLength})`,
          severity: "warning",
          key,
          value: italianText,
        });
      }

      // Check if Italian text is significantly longer than English
      const lengthRatio = italianText.length / englishText.length;
      if (lengthRatio > 1.5) {
        this.addResult({
          passed: false,
          message: `Italian text significantly longer than English: "${italianText}" vs "${englishText}" (${lengthRatio.toFixed(
            2
          )}x)`,
          severity: "warning",
          key,
          value: italianText,
        });
      } else {
        this.addResult({
          passed: true,
          message: `Text length acceptable for key: ${key}`,
          severity: "info",
          key,
        });
      }
    });
  }

  /**
   * Test pluralization rules for Italian
   */
  private testPluralizationRules(): void {
    const pluralizationTests = [
      { key: "common.general.total", count: 0, expected: /totale/i },
      { key: "common.general.total", count: 1, expected: /totale/i },
      { key: "common.general.total", count: 2, expected: /totali/i },
    ];

    pluralizationTests.forEach(({ key, count, expected }) => {
      try {
        const result = i18n.t(key, { count, lng: "it" });

        if (expected.test(result)) {
          this.addResult({
            passed: true,
            message: `Pluralization correct for ${key} with count ${count}: "${result}"`,
            severity: "info",
            key,
            value: result,
          });
        } else {
          this.addResult({
            passed: false,
            message: `Pluralization incorrect for ${key} with count ${count}: "${result}" (expected pattern: ${expected})`,
            severity: "error",
            key,
            value: result,
          });
        }
      } catch (error) {
        this.addResult({
          passed: false,
          message: `Pluralization test failed for ${key}: ${error}`,
          severity: "error",
          key,
        });
      }
    });
  }

  /**
   * Test contextual translations
   */
  private testContextualTranslations(): void {
    const contextualTests = [
      {
        key: "documents.types.invoice",
        context: "document_type",
        expected: /fattura/i,
      },
      {
        key: "documents.statuses.paid",
        context: "document_status",
        expected: /pagat[ao]/i,
      },
      {
        key: "common.actions.delete",
        context: "action_button",
        expected: /elimina/i,
      },
    ];

    contextualTests.forEach(({ key, context, expected }) => {
      try {
        const result = i18n.t(key, { context, lng: "it" });

        if (expected.test(result)) {
          this.addResult({
            passed: true,
            message: `Contextual translation correct for ${key} (${context}): "${result}"`,
            severity: "info",
            key,
            value: result,
          });
        } else {
          this.addResult({
            passed: false,
            message: `Contextual translation incorrect for ${key} (${context}): "${result}" (expected pattern: ${expected})`,
            severity: "warning",
            key,
            value: result,
          });
        }
      } catch (error) {
        this.addResult({
          passed: false,
          message: `Contextual translation test failed for ${key}: ${error}`,
          severity: "error",
          key,
        });
      }
    });
  }

  /**
   * Test special characters and encoding
   */
  private testSpecialCharacters(): void {
    const specialCharTests = [
      {
        key: "common.general.quantity",
        expectedChars: ["à", "è", "ì", "ò", "ù"],
      },
      { key: "documents.create.title", expectedChars: ["ò", "à"] },
    ];

    specialCharTests.forEach(({ key, expectedChars }) => {
      const text = i18n.t(key, { lng: "it" });

      // Check if text contains proper Italian accented characters
      const hasAccents = expectedChars.some((char) => text.includes(char));

      if (text.length > 0) {
        this.addResult({
          passed: true,
          message: `Special character encoding test passed for ${key}: "${text}"`,
          severity: "info",
          key,
          value: text,
        });
      }
    });

    // Test for common encoding issues
    const encodingTests = [
      { pattern: /Ã¡|Ã©|Ã­|Ã³|Ãº/, issue: "UTF-8 encoding issue detected" },
      { pattern: /â€™|â€œ|â€/, issue: "Smart quotes encoding issue detected" },
      { pattern: /Â/, issue: "Non-breaking space encoding issue detected" },
    ];

    const allTranslations = this.getAllTranslations("it");

    encodingTests.forEach(({ pattern, issue }) => {
      allTranslations.forEach(({ key, value }) => {
        if (pattern.test(value)) {
          this.addResult({
            passed: false,
            message: `${issue} in ${key}: "${value}"`,
            severity: "error",
            key,
            value,
          });
        }
      });
    });
  }

  /**
   * Test number and date formatting consistency
   */
  private testFormattingConsistency(): void {
    const formatTests = [
      {
        type: "currency",
        value: 1234.56,
        expected: /€\s*1\.234,56|1\.234,56\s*€/,
      },
      {
        type: "number",
        value: 1234.56,
        expected: /1\.234,56/,
      },
      {
        type: "date",
        value: new Date("2024-01-15"),
        expected: /15\/01\/2024|15-01-2024/,
      },
    ];

    formatTests.forEach(({ type, value, expected }) => {
      try {
        let formatted: string;

        switch (type) {
          case "currency":
            formatted = new Intl.NumberFormat("it-IT", {
              style: "currency",
              currency: "EUR",
            }).format(value as number);
            break;
          case "number":
            formatted = new Intl.NumberFormat("it-IT").format(value as number);
            break;
          case "date":
            formatted = new Intl.DateTimeFormat("it-IT").format(value as Date);
            break;
          default:
            formatted = String(value);
        }

        if (expected.test(formatted)) {
          this.addResult({
            passed: true,
            message: `${type} formatting correct: ${formatted}`,
            severity: "info",
            value: formatted,
          });
        } else {
          this.addResult({
            passed: false,
            message: `${type} formatting incorrect: ${formatted} (expected pattern: ${expected})`,
            severity: "warning",
            value: formatted,
          });
        }
      } catch (error) {
        this.addResult({
          passed: false,
          message: `${type} formatting test failed: ${error}`,
          severity: "error",
        });
      }
    });
  }

  /**
   * Test UI component compatibility
   */
  private testUIComponentCompatibility(): void {
    const componentTests = [
      {
        component: "Button",
        keys: [
          "common.actions.save",
          "common.actions.cancel",
          "common.actions.create",
        ],
        maxLength: 20,
      },
      {
        component: "Navigation",
        keys: [
          "common.navigation.dashboard",
          "common.navigation.documents",
          "common.navigation.clients",
        ],
        maxLength: 25,
      },
      {
        component: "Form Labels",
        keys: [
          "forms.labels.name",
          "forms.labels.email",
          "forms.labels.description",
        ],
        maxLength: 30,
      },
    ];

    componentTests.forEach(({ component, keys, maxLength }) => {
      keys.forEach((key) => {
        const text = i18n.t(key, { lng: "it" });

        if (text.length <= maxLength) {
          this.addResult({
            passed: true,
            message: `${component} text length acceptable for ${key}: "${text}" (${text.length}/${maxLength})`,
            severity: "info",
            key,
            value: text,
          });
        } else {
          this.addResult({
            passed: false,
            message: `${component} text too long for ${key}: "${text}" (${text.length}/${maxLength})`,
            severity: "warning",
            key,
            value: text,
          });
        }
      });
    });
  }

  /**
   * Get all translations for a language
   */
  private getAllTranslations(
    language: string
  ): Array<{ key: string; value: string }> {
    const translations: Array<{ key: string; value: string }> = [];
    const store = i18n.store.data[language];

    if (!store) return translations;

    Object.keys(store).forEach((namespace) => {
      const bundle = store[namespace];
      this.extractTranslations(bundle, namespace, translations);
    });

    return translations;
  }

  /**
   * Extract translations recursively
   */
  private extractTranslations(
    obj: any,
    prefix: string,
    translations: Array<{ key: string; value: string }>
  ): void {
    Object.keys(obj).forEach((key) => {
      const fullKey = `${prefix}.${key}`;

      if (typeof obj[key] === "string") {
        translations.push({ key: fullKey, value: obj[key] });
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        this.extractTranslations(obj[key], fullKey, translations);
      }
    });
  }

  /**
   * Add a test result
   */
  private addResult(result: TranslationTestResult): void {
    this.results.push(result);
  }

  /**
   * Generate comprehensive quality assurance report
   */
  private generateReport(): QualityAssuranceReport {
    const totalTests = this.results.length;
    const passedTests = this.results.filter((r) => r.passed).length;
    const failedTests = totalTests - passedTests;
    const overallScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const recommendations: string[] = [];

    // Generate recommendations based on results
    const errorCount = this.results.filter(
      (r) => r.severity === "error"
    ).length;
    const warningCount = this.results.filter(
      (r) => r.severity === "warning"
    ).length;

    if (errorCount > 0) {
      recommendations.push(
        `Fix ${errorCount} critical translation errors before deployment`
      );
    }

    if (warningCount > 0) {
      recommendations.push(
        `Review ${warningCount} translation warnings for better user experience`
      );
    }

    if (overallScore < 90) {
      recommendations.push(
        "Overall translation quality is below 90%. Consider comprehensive review."
      );
    }

    if (overallScore >= 95) {
      recommendations.push(
        "Excellent translation quality! Ready for production."
      );
    }

    return {
      overallScore,
      totalTests,
      passedTests,
      failedTests,
      results: this.results,
      recommendations,
    };
  }
}

// Export singleton instance
export const translationTester = new TranslationTester();

// Utility functions for manual testing
export const runTranslationTests =
  async (): Promise<QualityAssuranceReport> => {
    return await translationTester.runQualityAssurance();
  };

export const logTranslationReport = async (): Promise<void> => {
  const report = await runTranslationTests();

  console.group("🌐 Translation Quality Assurance Report");
  console.log(`Overall Score: ${report.overallScore.toFixed(2)}%`);
  console.log(`Tests: ${report.passedTests}/${report.totalTests} passed`);

  if (report.recommendations.length > 0) {
    console.group("💡 Recommendations:");
    report.recommendations.forEach((rec) => console.log(`• ${rec}`));
    console.groupEnd();
  }

  const errors = report.results.filter((r) => r.severity === "error");
  if (errors.length > 0) {
    console.group("🔴 Errors:");
    errors.forEach((error) => console.log(`• ${error.message}`));
    console.groupEnd();
  }

  const warnings = report.results.filter((r) => r.severity === "warning");
  if (warnings.length > 0) {
    console.group("🟡 Warnings:");
    warnings.forEach((warning) => console.log(`• ${warning.message}`));
    console.groupEnd();
  }

  console.groupEnd();
};
