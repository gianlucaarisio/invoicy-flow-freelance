import { render, screen } from "@testing-library/react";
import { useTranslation } from "@/hooks/useTranslation";

// Simple test component to verify i18n setup
function TestComponent() {
  const { t } = useTranslation("common");

  return (
    <div>
      <h1>{t("navigation.dashboard")}</h1>
      <button>{t("actions.create")}</button>
    </div>
  );
}

describe("i18n Configuration", () => {
  it("should load Italian translations by default", () => {
    render(<TestComponent />);

    // Should show Italian text
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Crea")).toBeInTheDocument();
  });
});
