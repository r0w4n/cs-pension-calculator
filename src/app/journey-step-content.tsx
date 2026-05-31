import { useMemo } from "react";
import { fieldGroups, type FieldDefinition } from "../fieldDefinitions";
import {
  deriveInflationAssumptions,
  type PensionSummary,
  type RetirementIncomeDisplay,
  type ProjectionRow,
} from "../projection";
import {
  RetirementIncomeBridgeChart,
  type RetirementIncomeBridgeLimits,
  type RetirementIncomeBridgeParameters,
  type RetirementIncomePoint,
} from "../RetirementIncomeBridgeChart";
import type { PensionSettings, PensionValidationIssue } from "../settings";
import {
  OPTIONAL_SECTION_TOGGLES,
  buildComparisonStatusItems,
  clonePensionSettings,
  createComparisonResult,
  formatDate,
  formatDecimalAge,
  getSettingsSignature,
  type ComparisonResultCache,
  type ComparisonScenario,
  type JourneyFieldLabels,
  type JourneyStepDefinition,
  type OptionalSectionToggleKey,
} from "../app-domains";
import { ComparisonBridgeChart } from "./chart";
import {
  ComparisonPanel as ComparisonPanelFeature,
  ComparisonSection,
  PensionSummarySection as PensionSummarySectionFeature,
} from "./comparison";
import {
  ProjectionTableSection as ProjectionTableSectionFeature,
  ProjectionTableSectionContainer,
} from "./projection-table";
import {
  AddedPensionLumpSumsEditor as AddedPensionLumpSumsEditorFeature,
  SettingsFields as SettingsFieldsFeature,
  getValidationIssuesForField,
  type SettingsFieldOnChange,
} from "./form-fields";
import {
  InflationBasisPanel as InflationBasisPanelFeature,
  SummarySection as SummarySectionFeature,
  type SummaryItem,
  ValidationIssuesSection as ValidationIssuesSectionFeature,
  ResultsSummarySection,
} from "./results-summary";

export type JourneyStepViewModel = {
  settings: PensionSettings;
  validationIssues: PensionValidationIssue[];
  pensionSummary: PensionSummary | null;
  retirementIncomeSeries: RetirementIncomePoint[];
  bridgeChartParameters: RetirementIncomeBridgeParameters;
  bridgeChartLimits: RetirementIncomeBridgeLimits;
  derivedInflationAssumptions: ReturnType<typeof deriveInflationAssumptions>;
  projectionRows: ProjectionRow[];
  retirementIncomeDisplay: RetirementIncomeDisplay;
  retirementIncomeItems: SummaryItem[];
  retirementIncomeTitle: string;
  retirementIncomeTotal: string;
  retirementIncomeTargetTitle: string;
  retirementIncomeTarget: string;
  showGuidanceNotes: boolean;
  useDropdownDates: boolean;
  onChange: SettingsFieldOnChange;
  onChangeChartParameters: (
    patch: Partial<RetirementIncomeBridgeParameters>
  ) => void;
  comparisonScenarios: ComparisonScenario[];
  comparisonResultCache: ComparisonResultCache;
  onScenariosChange: (scenarios: ComparisonScenario[]) => void;
  onLoadScenario: (scenarioSettings: PensionSettings) => void;
  onRetirementIncomeDisplayChange: (display: RetirementIncomeDisplay) => void;
  showLimitations: boolean;
  onToggleLimitations: () => void;
};

export type JourneyStepContentProps = {
  step: JourneyStepDefinition;
  viewModel: JourneyStepViewModel;
};

export function JourneyStepContent({
  step,
  viewModel,
}: JourneyStepContentProps) {
  const {
    settings,
    validationIssues,
    pensionSummary,
    retirementIncomeSeries,
    bridgeChartParameters,
    bridgeChartLimits,
    derivedInflationAssumptions,
    projectionRows,
    retirementIncomeDisplay,
    retirementIncomeItems,
    retirementIncomeTitle,
    retirementIncomeTotal,
    retirementIncomeTargetTitle,
    retirementIncomeTarget,
    showGuidanceNotes,
    useDropdownDates,
    onChange,
    onChangeChartParameters,
    comparisonScenarios,
    comparisonResultCache,
    onScenariosChange,
    onLoadScenario,
    onRetirementIncomeDisplayChange,
    showLimitations,
    onToggleLimitations,
  } = viewModel;

  const currentComparisonResult = useMemo(
    () =>
      createComparisonResult(
        {
          id: "current-model",
          name: "Current model",
          settings: clonePensionSettings(settings),
          createdAt: "",
          updatedAt: "",
        },
        getSettingsSignature(settings),
        comparisonResultCache
      ),
    [comparisonResultCache, settings]
  );

  if (step.kind === "optional-sections") {
    return (
      <OptionalSectionToggleGrid
        settings={settings}
        onChange={onChange}
        toggleKeys={step.toggleKeys}
      />
    );
  }

  if (step.kind === "answer") {
    if (!pensionSummary) {
      return null;
    }

    return (
      <>
        {validationIssues.length > 0 ? (
          <ValidationIssuesSectionFeature validationIssues={validationIssues} />
        ) : null}

        <PensionSummarySectionFeature
          activeResult={currentComparisonResult}
          headingLevel={2}
          description="This answer updates automatically as you adjust the journey assumptions."
          retirementIncomeDisplay={retirementIncomeDisplay}
          onRetirementIncomeDisplayChange={onRetirementIncomeDisplayChange}
          retirementIncomeItems={retirementIncomeItems}
          retirementIncomeTitle={retirementIncomeTitle}
          retirementIncomeTotal={retirementIncomeTotal}
          retirementIncomeTargetTitle={retirementIncomeTargetTitle}
          retirementIncomeTarget={retirementIncomeTarget}
          statusItems={
            currentComparisonResult
              ? buildComparisonStatusItems(currentComparisonResult)
              : []
          }
          showLimitations={showLimitations}
          onToggleLimitations={onToggleLimitations}
        />

        <InflationBasisPanelFeature
          settings={settings}
          assumptions={derivedInflationAssumptions}
        />

        <SummarySectionFeature
          title="Key dates"
          items={[
            ...(settings.showAlpha
              ? [
                  {
                    label: "Alpha pension starts",
                    value: formatDate(
                      pensionSummary.keyDates.startsAlphaPension
                    ),
                  },
                ]
              : []),
            ...(settings.showStatePension
              ? [
                  {
                    label: "State Pension starts",
                    value: formatDate(
                      pensionSummary.keyDates.startsStatePension
                    ),
                  },
                ]
              : []),
            {
              label: "Normal Pension Age",
              value: formatDecimalAge(
                pensionSummary.calculated.normalPensionAge
              ),
            },
          ]}
        />

        <RetirementIncomeBridgeChart
          data={retirementIncomeSeries}
          alphaLabel="Alpha pension"
          limits={bridgeChartLimits}
          statePensionEditable
          validationIssues={validationIssues}
          onChangeParameters={onChangeChartParameters}
          {...bridgeChartParameters}
        />

        <ComparisonPanelFeature
          settings={settings}
          validationIssues={validationIssues}
          scenarios={comparisonScenarios}
          comparisonResultCache={comparisonResultCache}
          onScenariosChange={onScenariosChange}
          onLoadScenario={onLoadScenario}
          retirementIncomeDisplay={retirementIncomeDisplay}
          onRetirementIncomeDisplayChange={onRetirementIncomeDisplayChange}
          showLimitations={showLimitations}
          onToggleLimitations={onToggleLimitations}
          derivedInflationAssumptions={derivedInflationAssumptions}
          retirementIncomeSeries={retirementIncomeSeries}
          bridgeChartParameters={bridgeChartParameters}
          bridgeChartLimits={bridgeChartLimits}
          onChangeChartParameters={onChangeChartParameters}
        />
      </>
    );
  }

  if (step.kind === "bridge-answer") {
    return (
      <>
        {validationIssues.length > 0 ? (
          <ValidationIssuesSectionFeature validationIssues={validationIssues} />
        ) : null}

        <ResultsSummarySection>
          <PensionSummarySectionFeature
            activeResult={currentComparisonResult}
            headingLevel={2}
            description="This summary uses your current journey assumptions and shows your projected annual income before tax."
            retirementIncomeDisplay={retirementIncomeDisplay}
            onRetirementIncomeDisplayChange={onRetirementIncomeDisplayChange}
            retirementIncomeItems={retirementIncomeItems}
            retirementIncomeTitle={retirementIncomeTitle}
            retirementIncomeTotal={retirementIncomeTotal}
            retirementIncomeTargetTitle={retirementIncomeTargetTitle}
            retirementIncomeTarget={retirementIncomeTarget}
            statusItems={
              currentComparisonResult
                ? buildComparisonStatusItems(currentComparisonResult)
                : []
            }
            showLimitations={showLimitations}
            onToggleLimitations={onToggleLimitations}
          />
        </ResultsSummarySection>

        <InflationBasisPanelFeature
          settings={settings}
          assumptions={derivedInflationAssumptions}
        />

        <ComparisonBridgeChart
          retirementIncomeSeries={retirementIncomeSeries}
          bridgeChartParameters={bridgeChartParameters}
          bridgeChartLimits={bridgeChartLimits}
          validationIssues={validationIssues}
          onChangeChartParameters={onChangeChartParameters}
        />

        <ComparisonSection>
          <ComparisonPanelFeature
            settings={settings}
            validationIssues={validationIssues}
            scenarios={comparisonScenarios}
            comparisonResultCache={comparisonResultCache}
            onScenariosChange={onScenariosChange}
            onLoadScenario={onLoadScenario}
          />
        </ComparisonSection>

        {step.showProjectionTable !== false ? (
          <ProjectionTableSectionContainer>
            <ProjectionTableSectionFeature
              rows={projectionRows}
              settings={settings}
            />
          </ProjectionTableSectionContainer>
        ) : null}
      </>
    );
  }

  if (step.kind === "fields") {
    return (
      <>
        <SettingsFieldsFeature
          fields={getFieldsByIds(step.fieldIds, step.fieldLabels)}
          settings={settings}
          validationIssues={validationIssues}
          onChange={onChange}
          showGuidanceNotes={showGuidanceNotes}
          useDropdownDates={useDropdownDates}
        />

        {step.fieldIds.includes("alphaAddedPensionMonthly") ? (
          <AddedPensionLumpSumsEditorFeature
            lumpSums={settings.alphaAddedPensionLumpSums}
            defaultStartDate={settings.startDate}
            useDropdownDates={useDropdownDates}
            title="Added pension lump sums"
            description="Add one-off or yearly added-pension lump sum purchases alongside the regular monthly amount."
            showFactorType
            validationIssues={getValidationIssuesForField(
              validationIssues,
              "alphaAddedPensionLumpSums"
            )}
            onChange={(nextLumpSums) =>
              onChange("alphaAddedPensionLumpSums", nextLumpSums)
            }
          />
        ) : null}
      </>
    );
  }

  return null;
}

export function OptionalSectionToggleGrid({
  settings,
  onChange,
  toggleKeys,
}: {
  settings: PensionSettings;
  onChange: SettingsFieldOnChange;
  toggleKeys?: readonly OptionalSectionToggleKey[];
}) {
  const visibleToggles = toggleKeys
    ? OPTIONAL_SECTION_TOGGLES.filter((toggle) =>
        toggleKeys.includes(toggle.key)
      )
    : OPTIONAL_SECTION_TOGGLES;

  return (
    <div className="field-grid">
      {visibleToggles.map((toggle) => (
        <label key={toggle.key} className="field-card checkbox-field-card">
          <span className="field-header">
            <span className="field-label-group">
              <span className="field-label">{toggle.label}</span>
            </span>
          </span>
          <span className="checkbox-row">
            <input
              aria-label={toggle.label}
              type="checkbox"
              checked={settings[toggle.key]}
              onChange={(event) => onChange(toggle.key, event.target.checked)}
            />
            <span>{toggle.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function getFieldsByIds(
  fieldIds: readonly FieldDefinition["id"][],
  fieldLabels: JourneyFieldLabels = {}
) {
  return fieldIds
    .map((fieldId) => {
      const field = fieldGroups
        .flatMap((group) => group.fields)
        .find((candidate) => candidate.id === fieldId);

      if (!field) {
        return undefined;
      }

      return fieldLabels[fieldId]
        ? { ...field, label: fieldLabels[fieldId] }
        : field;
    })
    .filter((field): field is FieldDefinition => Boolean(field));
}
