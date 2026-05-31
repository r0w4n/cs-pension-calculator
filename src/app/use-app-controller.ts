import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SettingsKey } from "../fieldDefinitions";
import {
  calculateRetirementIncomeTargetAtDate,
  createProjectionTable,
  deriveInflationAssumptions,
  generatePensionSummary,
  type RetirementIncomeDisplay,
} from "../projection";
import type { RetirementIncomeBridgeParameters } from "../RetirementIncomeBridgeChart";
import {
  getStoredSettingsSnapshot,
  loadStoredSettings,
  saveSettings,
  validateSettings,
  type PensionSettings,
} from "../settings";
import {
  loadAcknowledgementState,
  loadStoredAppMode,
  loadStoredGuidanceNotes,
  saveAcknowledgementState,
  saveStoredGuidanceNotes,
  type AppMode,
} from "./app-persistence";
import {
  loadComparisonScenario as loadComparisonScenarioAction,
  resetSettings as resetSettingsAction,
  selectAppMode as selectAppModeAction,
  showSavedLabel as showSavedLabelAction,
} from "./app-actions";
import {
  updateBridgeChartParameters as updateBridgeChartParametersAction,
  updateSetting as updateSettingAction,
} from "./chart-state";
import {
  JOURNEY_DEFINITIONS,
  addYearsToIsoDate,
  buildRetirementIncomeItems,
  createBridgeChartLimits,
  createBridgeChartParameters,
  createRetirementIncomeSeries,
  formatCurrencyDetailed,
  getRetirementIncomeTargetTitle,
  getRetirementIncomeTitle,
  loadStoredComparisonScenarios,
  saveStoredComparisonScenarios,
  type ComparisonResultCache,
  type ComparisonScenario,
} from "../app-domains";
import { useMobileDateDropdowns as useMobileDateDropdownsHook } from "./form-fields";
import type { JourneyStepViewModel } from "./journey-step-content";
import type { JourneyMode } from "./journey-mode-screen";

const [
  bridgeJourneyDefinition,
  simpleJourneyDefinition,
  expertJourneyDefinition,
] = JOURNEY_DEFINITIONS;

const JOURNEY_DEFINITION_BY_MODE = {
  bridge: bridgeJourneyDefinition,
  simple: simpleJourneyDefinition,
  expert: expertJourneyDefinition,
} satisfies Record<JourneyMode, (typeof JOURNEY_DEFINITIONS)[number]>;

export function useAppController() {
  const [settings, setSettings] = useState<PensionSettings>(loadStoredSettings);
  const [chartUndoStack, setChartUndoStack] = useState<PensionSettings[]>([]);
  const [settingsFormVersion, setSettingsFormVersion] = useState(0);
  const [appMode, setAppMode] = useState<AppMode | null>(loadStoredAppMode);
  const [showGuidanceNotes, setShowGuidanceNotes] = useState(
    loadStoredGuidanceNotes
  );
  const [retirementIncomeDisplay, setRetirementIncomeDisplay] =
    useState<RetirementIncomeDisplay>("monthly");
  const [comparisonScenarios, setComparisonScenarios] = useState<
    ComparisonScenario[]
  >(loadStoredComparisonScenarios);
  const [showLimitations, setShowLimitations] = useState(false);
  const [hasAcknowledgedNotice, setHasAcknowledgedNotice] = useState(
    loadAcknowledgementState
  );
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const savedFeedbackTimer = useRef<ReturnType<
    typeof window.setTimeout
  > | null>(null);
  const [comparisonResultCache] = useState<ComparisonResultCache>(
    () => new Map()
  );
  const activeModeRef = useRef<HTMLDivElement | null>(null);
  const shouldFocusActiveMode = useRef(false);
  const scrollActiveModeIntoView = useCallback(() => {
    window.requestAnimationFrame(() => {
      activeModeRef.current?.focus({ preventScroll: true });
      if (typeof activeModeRef.current?.scrollIntoView === "function") {
        activeModeRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  }, []);
  const useDropdownDates = useMobileDateDropdownsHook();
  const deferredSettings = useDeferredValue(settings);
  const validationIssues = useMemo(
    () => validateSettings(deferredSettings),
    [deferredSettings]
  );
  const projectionRows = useMemo(
    () => createProjectionTable(deferredSettings),
    [deferredSettings]
  );
  const pensionSummary = useMemo(
    () => generatePensionSummary(projectionRows, deferredSettings),
    [projectionRows, deferredSettings]
  );
  const retirementIncomeSeries = useMemo(
    () => createRetirementIncomeSeries(projectionRows, deferredSettings),
    [projectionRows, deferredSettings]
  );
  const bridgeChartParameters = useMemo(
    () => createBridgeChartParameters(settings),
    [settings]
  );
  const bridgeChartLimits = useMemo(
    () => createBridgeChartLimits(settings),
    [settings]
  );
  const derivedInflationAssumptions = useMemo(
    () => deriveInflationAssumptions(deferredSettings),
    [deferredSettings]
  );
  const retirementIncomeTitle = getRetirementIncomeTitle(
    settings.taxationEnabled,
    retirementIncomeDisplay
  );
  const retirementIncomeItems = pensionSummary
    ? buildRetirementIncomeItems(pensionSummary, retirementIncomeDisplay)
    : [];
  const retirementIncomeTotal = formatCurrencyDetailed(
    retirementIncomeDisplay === "monthly"
      ? (pensionSummary?.retirementIncome.totalMonthlyIncome ?? 0)
      : (pensionSummary?.retirementIncome.totalAnnualIncome ?? 0)
  );
  const retirementIncomeTargetTitle = getRetirementIncomeTargetTitle(
    retirementIncomeDisplay
  );
  const annualRetirementIncomeTarget = calculateRetirementIncomeTargetAtDate(
    settings,
    addYearsToIsoDate(settings.dateOfBirth, settings.requirementAge)
  );
  const retirementIncomeTarget = formatCurrencyDetailed(
    retirementIncomeDisplay === "monthly"
      ? annualRetirementIncomeTarget / 12
      : annualRetirementIncomeTarget
  );
  const activeJourneyMode = appMode;
  const activeJourneyDefinition = activeJourneyMode
    ? JOURNEY_DEFINITION_BY_MODE[activeJourneyMode]
    : null;

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredComparisonScenarios(comparisonScenarios);
  }, [comparisonScenarios]);

  useEffect(() => {
    saveStoredGuidanceNotes(showGuidanceNotes);
  }, [showGuidanceNotes]);

  useEffect(() => {
    if (!appMode || !shouldFocusActiveMode.current) {
      return;
    }

    shouldFocusActiveMode.current = false;
    scrollActiveModeIntoView();
  }, [appMode, scrollActiveModeIntoView]);

  useEffect(() => {
    const savedFeedbackTimeout = savedFeedbackTimer.current;
    return () => {
      if (savedFeedbackTimeout) {
        window.clearTimeout(savedFeedbackTimeout);
      }
    };
  }, []);

  useEffect(() => {
    const handleUndoShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "z" ||
        event.shiftKey ||
        event.altKey ||
        (!event.metaKey && !event.ctrlKey) ||
        chartUndoStack.length === 0 ||
        isEditableShortcutTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      setChartUndoStack((current) => {
        const previousSettings = current.at(-1);

        if (!previousSettings) {
          return current;
        }

        setSettings(previousSettings);
        return current.slice(0, -1);
      });
    };

    window.addEventListener("keydown", handleUndoShortcut);

    return () => window.removeEventListener("keydown", handleUndoShortcut);
  }, [chartUndoStack.length]);

  function showSavedLabel() {
    showSavedLabelAction({
      savedFeedbackTimerRef: savedFeedbackTimer,
      setShowSavedFeedback,
    });
  }

  function updateSetting<K extends SettingsKey>(
    key: K,
    value: PensionSettings[K]
  ) {
    updateSettingAction({
      key,
      value,
      showSavedLabel,
      startTransition,
      setChartUndoStack,
      setSettings,
    });
  }

  function updateBridgeChartParameters(
    patch: Partial<RetirementIncomeBridgeParameters>
  ) {
    updateBridgeChartParametersAction({
      patch,
      settings,
      showSavedLabel,
      setChartUndoStack,
      setSettings,
    });
  }

  function resetSettings() {
    resetSettingsAction({
      savedFeedbackTimerRef: savedFeedbackTimer,
      setShowSavedFeedback,
      setChartUndoStack,
      setSettingsFormVersion,
      setSettings,
    });
  }

  function loadComparisonScenario(scenarioSettings: PensionSettings) {
    loadComparisonScenarioAction({
      savedFeedbackTimerRef: savedFeedbackTimer,
      setShowSavedFeedback,
      scenarioSettings,
      setChartUndoStack,
      setSettingsFormVersion,
      setSettings,
    });
  }

  function exportParameters() {
    const snapshot = getStoredSettingsSnapshot(settings);
    const fileDate = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = objectUrl;
    link.download = `cs-pension-parameters-${fileDate}.json`;
    window.document.body.append(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
    showSavedLabel();
  }

  const toggleLimitations = useCallback(() => {
    setShowLimitations((current) => !current);
  }, []);

  const journeyStepViewModel: JourneyStepViewModel = {
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
    onChange: updateSetting,
    onChangeChartParameters: updateBridgeChartParameters,
    onReset: resetSettings,
    onExport: exportParameters,
    comparisonScenarios,
    comparisonResultCache,
    onScenariosChange: setComparisonScenarios,
    onLoadScenario: loadComparisonScenario,
    onRetirementIncomeDisplayChange: setRetirementIncomeDisplay,
    showLimitations,
    onToggleLimitations: toggleLimitations,
  };

  function acknowledgeNotice() {
    setHasAcknowledgedNotice(true);
    saveAcknowledgementState();
  }

  function selectAppMode(mode: AppMode) {
    selectAppModeAction({
      mode,
      currentMode: appMode,
      setSettings,
      setChartUndoStack,
      shouldFocusActiveModeRef: shouldFocusActiveMode,
      scrollActiveModeIntoView,
      setAppMode,
    });
  }

  return {
    activeJourneyDefinition,
    activeJourneyMode,
    activeModeRef,
    acknowledgeNotice,
    appMode,
    bridgeChartLimits,
    bridgeChartParameters,
    comparisonResultCache,
    comparisonScenarios,
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
    visibleSettings: settings,
  };
}

function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}
