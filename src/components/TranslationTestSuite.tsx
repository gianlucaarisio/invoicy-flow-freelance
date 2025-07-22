import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
} from "lucide-react";
import {
  runTranslationTests,
  QualityAssuranceReport,
  TranslationTestResult,
} from "@/utils/translationTesting";
import { useTranslation } from "@/hooks/useTranslation";

interface TranslationTestSuiteProps {
  onClose?: () => void;
}

export const TranslationTestSuite: React.FC<TranslationTestSuiteProps> = ({
  onClose,
}) => {
  const [report, setReport] = useState<QualityAssuranceReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const { t, changeLanguage, currentLanguage } = useTranslation();

  const runTests = async () => {
    setIsRunning(true);
    try {
      const testReport = await runTranslationTests();
      setReport(testReport);
    } catch (error) {
      console.error("Failed to run translation tests:", error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run tests automatically on component mount
    runTests();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 95) return "default";
    if (score >= 80) return "secondary";
    return "destructive";
  };

  const getSeverityIcon = (severity: TranslationTestResult["severity"]) => {
    switch (severity) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const groupResultsBySeverity = (results: TranslationTestResult[]) => {
    return {
      errors: results.filter((r) => r.severity === "error"),
      warnings: results.filter((r) => r.severity === "warning"),
      info: results.filter((r) => r.severity === "info"),
    };
  };

  const TestResultItem: React.FC<{ result: TranslationTestResult }> = ({
    result,
  }) => (
    <div className="flex items-start space-x-3 p-3 border rounded-lg">
      {getSeverityIcon(result.severity)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {result.message}
        </p>
        {result.key && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Key: {result.key}
          </p>
        )}
        {result.value && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded">
            "{result.value}"
          </p>
        )}
      </div>
    </div>
  );

  const LanguageSwitcher: React.FC = () => (
    <div className="flex space-x-2 mb-4">
      <Button
        variant={currentLanguage === "it" ? "default" : "outline"}
        size="sm"
        onClick={() => changeLanguage("it")}
      >
        🇮🇹 Italiano
      </Button>
      <Button
        variant={currentLanguage === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => changeLanguage("en")}
      >
        🇬🇧 English
      </Button>
    </div>
  );

  const TranslationPreview: React.FC = () => {
    const previewKeys = [
      "common.actions.create",
      "common.actions.save",
      "common.actions.cancel",
      "common.navigation.dashboard",
      "common.navigation.documents",
      "common.navigation.clients",
      "documents.title",
      "documents.create.title",
      "dashboard.welcome",
    ];

    return (
      <div className="space-y-4">
        <LanguageSwitcher />
        <div className="grid gap-3">
          {previewKeys.map((key) => (
            <div
              key={key}
              className="flex justify-between items-center p-3 border rounded-lg"
            >
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {key}
              </span>
              <span className="text-sm font-medium">{t(key)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ResponsiveTestPreview: React.FC = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Responsive Layout Test</h3>
      <div className="grid gap-4">
        {/* Button Layout Test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Button Layout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">{t("common.actions.create")}</Button>
              <Button size="sm" variant="outline">
                {t("common.actions.save")}
              </Button>
              <Button size="sm" variant="destructive">
                {t("common.actions.delete")}
              </Button>
              <Button size="sm" variant="secondary">
                {t("common.actions.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Layout Test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Navigation Layout</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="flex flex-col space-y-2">
              <a
                href="#"
                className="px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800"
              >
                {t("common.navigation.dashboard")}
              </a>
              <a
                href="#"
                className="px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t("common.navigation.documents")}
              </a>
              <a
                href="#"
                className="px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t("common.navigation.clients")}
              </a>
              <a
                href="#"
                className="px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t("common.navigation.items")}
              </a>
            </nav>
          </CardContent>
        </Card>

        {/* Form Layout Test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Form Layout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("forms.labels.name", "Nome")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={t(
                    "forms.placeholders.enterName",
                    "Inserisci nome"
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("forms.labels.description", "Descrizione")}
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={t(
                    "forms.placeholders.enterDescription",
                    "Inserisci descrizione"
                  )}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (!report && !isRunning) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Translation Test Suite</CardTitle>
          <CardDescription>
            Run comprehensive tests to ensure translation quality and UI
            compatibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Run Translation Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Translation Quality Assurance</CardTitle>
            <CardDescription>
              Comprehensive testing results for Italian translations
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={runTests}
              disabled={isRunning}
              variant="outline"
              size="sm"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isRunning ? "Running..." : "Rerun Tests"}
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                Close
              </Button>
            )}
          </div>
        </CardHeader>

        {report && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        report.overallScore
                      )}`}
                    >
                      {report.overallScore.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Overall Score
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {report.passedTests}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Passed
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {report.failedTests}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Failed
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {report.totalTests}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Tests
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Progress value={report.overallScore} className="mb-6" />

            {report.recommendations.length > 0 && (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommendations:</strong>
                  <ul className="mt-2 space-y-1">
                    {report.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="responsive">Responsive</TabsTrigger>
        </TabsList>

        {report && (
          <>
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Test Results Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {report.results.map((result, index) => (
                        <TestResultItem key={index} result={result} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="errors">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    Errors (
                    {groupResultsBySeverity(report.results).errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {groupResultsBySeverity(report.results).errors.map(
                        (result, index) => (
                          <TestResultItem key={index} result={result} />
                        )
                      )}
                      {groupResultsBySeverity(report.results).errors.length ===
                        0 && (
                        <p className="text-center text-gray-500 py-8">
                          No errors found! 🎉
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="warnings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                    Warnings (
                    {groupResultsBySeverity(report.results).warnings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {groupResultsBySeverity(report.results).warnings.map(
                        (result, index) => (
                          <TestResultItem key={index} result={result} />
                        )
                      )}
                      {groupResultsBySeverity(report.results).warnings
                        .length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                          No warnings found! ✨
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Translation Preview</CardTitle>
              <CardDescription>
                Preview translations in both languages to verify accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <TranslationPreview />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responsive">
          <Card>
            <CardHeader>
              <CardTitle>Responsive Design Test</CardTitle>
              <CardDescription>
                Test how translations fit in various UI components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <ResponsiveTestPreview />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
