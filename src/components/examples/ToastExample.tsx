import { Button } from "@/components/ui/button";
import { useTranslatedToast } from "@/hooks/useTranslatedToast";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Example component demonstrating the use of translated toast notifications
 */
const ToastExample = () => {
  const toast = useTranslatedToast();
  const { t } = useTranslation("common");

  const showSuccessToast = () => {
    toast.success("toast.success", {
      descriptionKey: "toast.dataUpdated",
    });
  };

  const showErrorToast = () => {
    toast.error("general.somethingWentWrong", {
      descriptionKey: "toast.tryAgain",
      namespace: "errors",
    });
  };

  const showInfoToast = () => {
    toast.info("toast.info", {
      descriptionKey: "toast.processing",
    });
  };

  const showLoadingToast = () => {
    toast.loading("toast.loading", {
      descriptionKey: "toast.pleaseWait",
    });
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="text-xl font-bold">{t("toast.examples")}</h2>
      <div className="flex flex-wrap gap-4">
        <Button onClick={showSuccessToast} variant="default">
          {t("toast.success")}
        </Button>
        <Button onClick={showErrorToast} variant="destructive">
          {t("toast.error")}
        </Button>
        <Button onClick={showInfoToast} variant="secondary">
          {t("toast.info")}
        </Button>
        <Button onClick={showLoadingToast} variant="outline">
          {t("toast.loading")}
        </Button>
      </div>
    </div>
  );
};

export default ToastExample;
