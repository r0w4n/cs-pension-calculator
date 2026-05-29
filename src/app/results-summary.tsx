import type { ReactNode } from "react";

type ResultsSummarySectionProps = {
  children: ReactNode;
};

export function ResultsSummarySection({ children }: ResultsSummarySectionProps) {
  return <>{children}</>;
}

type RetirementIncomeDisplay = "monthly" | "annual";

type RetirementIncomeDisplayToggleProps = {
  value: RetirementIncomeDisplay;
  onChange: (display: RetirementIncomeDisplay) => void;
};

export function RetirementIncomeDisplayToggle({
  value,
  onChange,
}: RetirementIncomeDisplayToggleProps) {
  return (
    <div className="summary-toggle" role="group" aria-label="Pension Summary display">
      <button
        type="button"
        className={
          value === "monthly"
            ? "summary-toggle-button summary-toggle-button--active"
            : "summary-toggle-button"
        }
        aria-pressed={value === "monthly"}
        onClick={() => onChange("monthly")}
      >
        Monthly
      </button>
      <button
        type="button"
        className={
          value === "annual"
            ? "summary-toggle-button summary-toggle-button--active"
            : "summary-toggle-button"
        }
        aria-pressed={value === "annual"}
        onClick={() => onChange("annual")}
      >
        Annual
      </button>
    </div>
  );
}

type RetirementIncomeSummaryFooterProps = {
  totalLabel: string;
  totalValue: string;
  targetLabel: string;
  targetValue: string;
};

export function RetirementIncomeSummaryFooter({
  totalLabel,
  totalValue,
  targetLabel,
  targetValue,
}: RetirementIncomeSummaryFooterProps) {
  return (
    <>
      <div className="summary-total" aria-label={totalLabel}>
        <span>{totalLabel}</span>
        <strong>{totalValue}</strong>
      </div>
      <div className="summary-target" aria-label={targetLabel}>
        <span>{targetLabel}</span>
        <strong>{targetValue}</strong>
      </div>
    </>
  );
}
