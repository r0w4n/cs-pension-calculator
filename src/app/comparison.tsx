import type { ReactNode } from "react";

type ComparisonSectionProps = {
  children: ReactNode;
};

export function ComparisonSection({ children }: ComparisonSectionProps) {
  return <>{children}</>;
}

export const MAX_COMPARISON_SCENARIOS = 5;

export type ComparisonScenarioActions = {
  currentScenarioIsValid: boolean;
  comparisonLimitReached: boolean;
  scenarioNameDraft: string;
  setScenarioNameDraft: (value: string) => void;
  addCurrentScenario: () => void;
};

export function ComparisonBuilder({
  scenarioCount,
  actions,
}: {
  scenarioCount: number;
  actions: ComparisonScenarioActions;
}) {
  return (
    <section className="comparison-builder" aria-labelledby="comparison-builder-title">
      <div>
        <h3 id="comparison-builder-title">Save this result as a scenario</h3>
        <p className="section-copy">
          You can save up to {MAX_COMPARISON_SCENARIOS} scenarios during this session.
        </p>
      </div>
      <div className="comparison-add-row">
        <label className="comparison-name-field">
          <span>Scenario name</span>
          <input
            className="text-input"
            type="text"
            value={actions.scenarioNameDraft}
            placeholder={`Scenario ${scenarioCount + 1}`}
            onChange={(event) => actions.setScenarioNameDraft(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="primary-button"
          disabled={!actions.currentScenarioIsValid || actions.comparisonLimitReached}
          onClick={actions.addCurrentScenario}
        >
          Add to comparison
        </button>
      </div>
      {!actions.currentScenarioIsValid ? (
        <p className="table-status">
          Fix the current validation issues before adding or replacing a scenario.
        </p>
      ) : null}
      {actions.comparisonLimitReached ? (
        <p className="table-status">
          Comparison limit reached. Remove a scenario before adding another.
        </p>
      ) : null}
    </section>
  );
}
