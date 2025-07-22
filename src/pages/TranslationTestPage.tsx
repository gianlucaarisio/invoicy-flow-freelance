import React from "react";
import { TranslationTestSuite } from "@/components/TranslationTestSuite";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TranslationTestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Translation Testing & Quality Assurance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive testing suite for Italian translations and UI
            compatibility
          </p>
        </div>

        <TranslationTestSuite />
      </div>
    </div>
  );
};

export default TranslationTestPage;
