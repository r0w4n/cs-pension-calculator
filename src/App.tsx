import {
  createRetirementIncomeSeries,
  buildComparisonStatusItems,
} from "./app-domains";
import { RetirementIncomeBridgeChart } from "./RetirementIncomeBridgeChart";
import { APP_MODE_STORAGE_KEY } from "./app/app-persistence";
import { ModeSelection } from "./app/mode-selection";
import { JourneySection } from "./app/journey";
import {
  ResultsSummarySection,
  InflationBasisPanel as InflationBasisPanelFeature,
} from "./app/results-summary";
import {
  ComparisonPanel as ComparisonPanelFeature,
  ComparisonSection,
  PensionSummarySection as PensionSummarySectionFeature,
} from "./app/comparison";
import {
  ProjectionTableSection as ProjectionTableSectionFeature,
  ProjectionTableSectionContainer,
} from "./app/projection-table";
import { JourneyModeScreen } from "./app/journey-mode-screen";
import { useAppController } from "./app/use-app-controller";
import { SettingsPanel } from "./app/settings-panel";
import { SiteFooter } from "./app/site-footer";

function App() {
  const {
    activeJourneyDefinition,
    activeJourneyMode,
    activeModeRef,
    acknowledgeNotice,
    appMode,
    bridgeChartLimits,
    bridgeChartParameters,
    comparisonResultCache,
    comparisonScenarios,
    currentComparisonResult,
    deferredSettings,
    derivedInflationAssumptions,
    exportParameters,
    hasAcknowledgedNotice,
    journeyStepViewModel,
    loadComparisonScenario,
    pensionSummary,
    projectionRows,
    resetSettings,
    retirementIncomeDisplay,
    retirementIncomeItems,
    retirementIncomeSeries,
    retirementIncomeTarget,
    retirementIncomeTargetTitle,
    retirementIncomeTitle,
    retirementIncomeTotal,
    selectAppMode,
    setComparisonScenarios,
    setRetirementIncomeDisplay,
    setShowGuidanceNotes,
    settings,
    settingsFormVersion,
    showGuidanceNotes,
    showLimitations,
    showSavedFeedback,
    toggleLimitations,
    updateBridgeChartParameters,
    updateSetting,
    useDropdownDates,
    validationIssues,
    visibleSettings,
  } = useAppController();

  return (
    <>
      {!hasAcknowledgedNotice ? (
        <div
          className="acknowledgement-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="acknowledgement-title"
        >
          <section className="acknowledgement-card">
            <p className="eyebrow">Before you continue</p>
            <h2 id="acknowledgement-title">Important information</h2>
            <p className="section-copy">
              This modeller is for planning and illustration only. It is not
              financial advice and is not affiliated with the Civil Service
              Pension Scheme, Capita, the Cabinet Office, or the Alpha Pension
              Scheme.
            </p>
            <p className="section-copy">
              Results depend entirely on the assumptions you enter. Check
              important decisions against your official pension statement and,
              where appropriate, a regulated financial adviser.
            </p>
            <p className="section-copy">
              Your inputs are saved locally in your browser so you can come back
              to the same assumptions later. This site does not use analytics
              cookies, and no financial or personal information is transmitted.
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={acknowledgeNotice}
            >
              I understand
            </button>
          </section>
        </div>
      ) : null}

      <main className="app-shell" aria-hidden={!hasAcknowledgedNotice}>
        {showSavedFeedback ? (
          <span className="saved-feedback" role="status" aria-live="polite">
            Saved Locally
          </span>
        ) : null}

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Civil Service</p>
            <h1>Retirement Income Modeller</h1>
            <p className="lead">
              Work through a Civil Service pension journey, then review your
              retirement income, funding gaps, key dates, and assumptions.
            </p>
          </div>

          <ModeSelection selectedMode={appMode} onSelectMode={selectAppMode} />
        </section>

        {activeJourneyMode && activeJourneyDefinition ? (
          <JourneyModeScreen
            activeModeRef={activeModeRef}
            mode={activeJourneyMode}
            journey={activeJourneyDefinition}
            settings={visibleSettings}
            showGuidanceNotes={showGuidanceNotes}
            onShowGuidanceNotesChange={setShowGuidanceNotes}
            journeyStepViewModel={journeyStepViewModel}
          />
        ) : null}

        {appMode === "expert" ? (
          <JourneySection activeModeRef={activeModeRef}>
            <ResultsSummarySection>
              <PensionSummarySectionFeature
                activeResult={currentComparisonResult}
                headingLevel={2}
                description="This summary is generated from the current calculation result, so the same structure can later support side-by-side scenario comparisons."
                retirementIncomeDisplay={retirementIncomeDisplay}
                onRetirementIncomeDisplayChange={setRetirementIncomeDisplay}
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
                onToggleLimitations={toggleLimitations}
              />
            </ResultsSummarySection>

            <section className="layout">
              <SettingsPanel
                settings={settings}
                settingsFormVersion={settingsFormVersion}
                validationIssues={validationIssues}
                onChange={updateSetting}
                onReset={resetSettings}
                onExport={exportParameters}
                showGuidanceNotes={showGuidanceNotes}
                onShowGuidanceNotesChange={setShowGuidanceNotes}
                useDropdownDates={useDropdownDates}
                pensionSummary={pensionSummary}
              />
            </section>

            <InflationBasisPanelFeature
              settings={deferredSettings}
              assumptions={derivedInflationAssumptions}
            />

            <RetirementIncomeBridgeChart
              data={retirementIncomeSeries}
              alphaLabel="Alpha pension"
              limits={bridgeChartLimits}
              statePensionEditable
              validationIssues={validationIssues}
              onChangeParameters={updateBridgeChartParameters}
              {...bridgeChartParameters}
            />
          </JourneySection>
        ) : null}

        {appMode === "expert" ? (
          <ComparisonSection>
            <ComparisonPanelFeature
              settings={settings}
              validationIssues={validationIssues}
              scenarios={comparisonScenarios}
              comparisonResultCache={comparisonResultCache}
              onScenariosChange={setComparisonScenarios}
              onLoadScenario={loadComparisonScenario}
            />
          </ComparisonSection>
        ) : null}

        {appMode === "expert" ? (
          <ProjectionTableSectionContainer>
            <ProjectionTableSectionFeature
              rows={projectionRows}
              settings={settings}
            />
          </ProjectionTableSectionContainer>
        ) : null}

        <SiteFooter />
      </main>
    </>
  );
}

export { createRetirementIncomeSeries };
export { APP_MODE_STORAGE_KEY };
export default App;
