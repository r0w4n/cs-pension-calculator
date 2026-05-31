import {
  calculateNormalPensionAge,
  getPartialRetirementContributionMultiplier,
  getPartialRetirementStartDate,
  getAlphaEpaDate,
  resolveAlphaAbsDate,
  validateSettings,
  type AddedPensionLumpSum,
  type PensionSettings,
} from "./settings";
import { calculateMonthlyIncomeTax } from "./projection-domains/tax";
import {
  getModelledAnnualGrowthRate,
  getModelledPensionInflationPercent,
} from "./projection-domains/inflation";
import { calculateAnnualNuvosPensionAtDate } from "./projection-domains/nuvos";
import {
  calculateSippProjectionRow,
  calculateTotalSippContributionsAfterTaxRelief,
} from "./projection-domains/sipp";
import {
  calculateIsaProjectionRow,
  calculateTotalIsaContributions,
} from "./projection-domains/isa";
import {
  calculateAccruedAlphaPension,
  calculateAnnualAlphaPensionIncludingEpaReduction,
  calculateAnnualAlphaPensionIncludingReduction,
  calculateLumpSumAddedPension,
  calculateMonthlyAddedPension,
  calculateMonthlyAlphaPensionGross,
  calculateMonthlyEpaAlphaAccrual,
  calculateMonthlyStandardAlphaAccrual,
  getEarlyRetirementReductionFactor,
} from "./projection-domains/alpha";
import {
  calculateAnnualStatePensionAtDate,
  calculateMonthlyStatePension,
  getStatePensionNominalIncreaseRate,
} from "./projection-domains/state-pension";
import {
  generateRetirementBridgeAnalysis as generateRetirementBridgeAnalysisDomain,
  prepareBridgeProjectionSettings as prepareBridgeProjectionSettingsDomain,
  type RetirementBridgeAnalysis as RetirementBridgeAnalysisDomain,
} from "./projection-domains/bridge-analysis";

export type ProjectionRow = {
  date: string;
  age: number;
  ageMonths: number;
  milestones: string[];
  milestoneDates: string[];
  monthlyAddedPension: number;
  lumpSumAddedPension: number;
  annualStandardAlphaPension: number;
  annualEpaAlphaPension: number;
  annualAccruedAlphaPension: number;
  annualAlphaPensionIncludingReduction: number;
  monthlyAlphaPensionGross: number;
  annualNuvosPension: number;
  annualNuvosPensionIncludingReduction: number;
  monthlyNuvosPensionGross: number;
  monthlyStatePension: number;
  sippPot: number;
  monthlySippPension: number;
  isaPot: number;
  monthlyIsaPension: number;
  totalMonthlyIncomeBeforeTax: number;
  monthlyIncomeTax: number;
  totalMonthlyNetIncome: number;
};

export type PensionSummary = {
  keyDates: {
    stopsAlphaAccrual: string;
    startsAlphaPension: string;
    stopsNuvosAccrual: string;
    startsNuvosPension: string;
    startsSippDraw: string;
    startsIsaDraw: string;
    startsStatePension: string;
  };
  alphaPension: {
    annualAtDraw: number;
    monthlyAtDraw: number;
    maximumAnnualAccrued: number;
    totalAddedAfterToday: number;
  };
  nuvosPension: {
    annualAtDraw: number;
    monthlyAtDraw: number;
    maximumAnnualAccrued: number;
  };
  sippPension: {
    potAtDraw: number;
    monthlyAtDraw: number;
    totalContributionsAfterTaxRelief: number;
  };
  isaPension: {
    potAtDraw: number;
    monthlyAtDraw: number;
    totalContributions: number;
  };
  incomeOverTime: {
    monthlyAtAlphaStart: number;
    monthlyAtStateStart: number;
    monthlyAfterStatePension: number;
    monthlyStatePension: number;
  };
  transitions: {
    yearsBetweenStoppingAccrualAndDrawingPension: number;
    yearsBetweenAlphaPensionAndStatePension: number;
  };
  calculated: {
    normalPensionAge: number;
    statePensionAge: number;
    earlyRetirementReductionPercent: number;
  };
  retirementIncome: RetirementIncomeSummary;
};

export type RetirementIncomeDisplay = "monthly" | "annual";

export type RetirementIncomeSource = {
  key: "alpha" | "nuvos" | "sipp" | "isa" | "statePension" | "incomeTax";
  label: string;
  monthlyIncome: number;
  annualIncome: number;
};

export type RetirementIncomeSummary = {
  sources: RetirementIncomeSource[];
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
};

export type BridgePhase = {
  startDate: string;
  endDate: string;
  startAge: number;
  startAgeMonths: number;
  endAge: number;
  endAgeMonths: number;
  label: string;
  incomeSourcesActive: string[];
  potUsed: string;
  annualTargetIncome: number;
  annualAlphaPension: number;
  annualNuvosPension: number;
  annualStatePension: number;
  annualIsaBridge: number;
  annualSippBridge: number;
  annualShortfall: number;
  annualSurplus: number;
  totalIsaBridge: number;
  totalSippBridge: number;
  totalBridgeRequired: number;
  unfundedShortfall: number;
};

export type BridgePotProjectionRow = {
  date: string;
  age: number;
  ageMonths: number;
  monthlyAlphaPension: number;
  monthlyNuvosPension: number;
  monthlyStatePension: number;
  isaBalance: number;
  sippBalance: number;
  isaDrawdown: number;
  sippDrawdown: number;
  unfundedShortfall: number;
  growth: number;
  milestones: string[];
  milestoneDates: string[];
};

export type RetirementBridgeAnalysis = RetirementBridgeAnalysisDomain;

const NUVOS_NORMAL_PENSION_AGE = 65;
const CALCULATION_START_LABEL = "Calculation start";
const LAST_ABS_STATEMENT_LABEL = "Last ABS";
const STOPS_ALPHA_ACCRUAL_LABEL = "Leave Alpha Pension Scheme";
const STARTS_ALPHA_PENSION_LABEL = "Starts Drawing Alpha Pension";
const STOPS_NUVOS_ACCRUAL_LABEL = "Leave nuvos Pension Scheme";
const STARTS_NUVOS_PENSION_LABEL = "Starts Drawing nuvos Pension";
const STARTS_SIPP_LABEL = "Starts Drawing SIPP";
const STARTS_ISA_LABEL = "Starts Drawing ISA";
const STARTS_STATE_PENSION_LABEL = "Starts Drawing State Pension";
const STARTS_PARTIAL_RETIREMENT_LABEL = "Starts Partial Retirement";
const LIFE_EXPECTANCY_LABEL = "Life expectancy";
const LUMP_SUM_ADDED_PENSION_LABEL = "Lump Sum Added Pension";
const SIPP_LUMP_SUM_LABEL = "SIPP Lump Sum";
const ISA_LUMP_SUM_LABEL = "ISA Lump Sum";
const ALPHA_IN_SERVICE_REVALUATION_UPLIFT_RATE = 0.015;

type MilestoneDefinition = {
  date: string;
  label: string;
};

type ProjectionRowWithoutMilestones = Omit<
  ProjectionRow,
  "milestones" | "milestoneDates"
>;

type AlphaBenefitPortion = "standard" | "epa";

type AlphaRevaluationEvent = {
  amount: number;
  dueDate: string;
  portion: AlphaBenefitPortion;
};

export type DerivedProjectionInputs = {
  endDate: string;
  drawDate: string;
  alphaStopDate: string;
  accrualStopDate: string;
  nuvosDrawDate: string;
  nuvosAccrualStopDate: string;
  nuvosNpaDate: string;
  nuvosReductionFactor: number;
  addedPensionStopDate: string;
  npaDate: string;
  epaDate: string;
  reductionFactor: number;
  epaReductionFactor: number;
};

export type DerivedInflationAssumptions = {
  projectionBasis: PensionSettings["projectionBasis"];
  inflationRateAnnual: number;
  inflationRateMonthly: number;
  sippNominalReturnAnnual: number;
  sippModelledReturnAnnual: number;
  isaNominalReturnAnnual: number;
  isaModelledReturnAnnual: number;
  alphaNominalInServiceRevaluationAnnual: number;
  alphaModelledInServiceRevaluationAnnual: number;
  alphaNominalDeferredIncreaseAnnual: number;
  alphaModelledDeferredIncreaseAnnual: number;
  nuvosNominalDeferredIncreaseAnnual: number;
  nuvosModelledDeferredIncreaseAnnual: number;
  statePensionNominalIncreaseAnnual: number;
  statePensionModelledIncreaseAnnual: number;
};

export function deriveInflationAssumptions(
  settings: PensionSettings
): DerivedInflationAssumptions {
  const inflationRateAnnual = settings.inflationRateAnnual / 100;
  const inflationRateMonthly = (1 + inflationRateAnnual) ** (1 / 12) - 1;
  const sippNominalReturnAnnual = settings.sippRealInterestPercent / 100;
  const isaNominalReturnAnnual = settings.isaRealInterestPercent / 100;
  const alphaNominalInServiceRevaluationAnnual =
    inflationRateAnnual + ALPHA_IN_SERVICE_REVALUATION_UPLIFT_RATE;
  const statePensionNominalIncreaseAnnual =
    getStatePensionNominalIncreaseRate(settings);

  return {
    projectionBasis: settings.projectionBasis,
    inflationRateAnnual,
    inflationRateMonthly,
    sippNominalReturnAnnual,
    sippModelledReturnAnnual: getModelledAnnualGrowthRate(
      settings,
      sippNominalReturnAnnual
    ),
    isaNominalReturnAnnual,
    isaModelledReturnAnnual: getModelledAnnualGrowthRate(
      settings,
      isaNominalReturnAnnual
    ),
    alphaNominalInServiceRevaluationAnnual,
    alphaModelledInServiceRevaluationAnnual:
      settings.projectionBasis === "real"
        ? ALPHA_IN_SERVICE_REVALUATION_UPLIFT_RATE
        : alphaNominalInServiceRevaluationAnnual,
    alphaNominalDeferredIncreaseAnnual: inflationRateAnnual,
    alphaModelledDeferredIncreaseAnnual:
      settings.projectionBasis === "real" ? 0 : inflationRateAnnual,
    nuvosNominalDeferredIncreaseAnnual: inflationRateAnnual,
    nuvosModelledDeferredIncreaseAnnual:
      settings.projectionBasis === "real" ? 0 : inflationRateAnnual,
    statePensionNominalIncreaseAnnual,
    statePensionModelledIncreaseAnnual: getModelledAnnualGrowthRate(
      settings,
      statePensionNominalIncreaseAnnual
    ),
  };
}

export function deriveProjectionInputs(
  settings: PensionSettings
): DerivedProjectionInputs | null {
  if (validateSettings(settings).length > 0) {
    return null;
  }

  const endDate = getLifeExpectancyDate(
    settings.dateOfBirth,
    settings.lifeExpectancy
  );
  const drawDate = addYears(settings.dateOfBirth, settings.alphaPensionDrawAge);
  const alphaStopDate = addYears(
    settings.dateOfBirth,
    settings.alphaPensionLeaveAge
  );
  const accrualStopDate = minIsoDate(drawDate, alphaStopDate);
  const nuvosDrawDate = addYears(
    settings.dateOfBirth,
    settings.nuvosPensionDrawAge
  );
  const nuvosAccrualStopDate = minIsoDate(
    nuvosDrawDate,
    addYears(settings.dateOfBirth, settings.nuvosPensionLeaveAge)
  );
  const nuvosNpaDate = addYears(settings.dateOfBirth, NUVOS_NORMAL_PENSION_AGE);
  const nuvosReductionFactor =
    nuvosDrawDate > nuvosNpaDate
      ? 1
      : getEarlyRetirementReductionFactor(
          NUVOS_NORMAL_PENSION_AGE,
          settings.nuvosPensionDrawAge
        );
  const addedPensionStopDate = accrualStopDate;
  const normalPensionAge = calculateNormalPensionAge(settings.dateOfBirth);
  const npaDate = addYears(settings.dateOfBirth, normalPensionAge);
  const epaDate = getAlphaEpaDate(settings);
  const reductionFactor =
    drawDate > npaDate
      ? 1
      : getEarlyRetirementReductionFactor(
          normalPensionAge,
          settings.alphaPensionDrawAge
        );
  const epaDrawAge = normalPensionAge - settings.alphaEpaYearsBeforeNpa;
  const epaReductionFactor =
    !settings.alphaEpaEnabled || drawDate >= epaDate
      ? 1
      : getEarlyRetirementReductionFactor(
          epaDrawAge,
          settings.alphaPensionDrawAge
        );

  return {
    endDate,
    drawDate,
    alphaStopDate,
    accrualStopDate,
    nuvosDrawDate,
    nuvosAccrualStopDate,
    nuvosNpaDate,
    nuvosReductionFactor,
    addedPensionStopDate,
    npaDate,
    epaDate,
    reductionFactor,
    epaReductionFactor,
  };
}

export function createProjectionTable(
  settings: PensionSettings
): ProjectionRow[] {
  const derivedInputs = deriveProjectionInputs(settings);

  if (!derivedInputs) {
    return [];
  }

  if (settings.applyPensionIncreases) {
    return createProjectionTableWithPensionIncreases(settings, derivedInputs);
  }

  const {
    endDate,
    drawDate,
    accrualStopDate,
    nuvosDrawDate,
    nuvosAccrualStopDate,
    nuvosNpaDate,
    nuvosReductionFactor,
    addedPensionStopDate,
    npaDate,
    epaDate,
    reductionFactor,
    epaReductionFactor,
  } = derivedInputs;
  const sippDrawDate = addYears(settings.dateOfBirth, settings.sippDrawAge);
  const isaDrawDate = addYears(settings.dateOfBirth, settings.isaDrawAge);
  const alphaAbsDate = resolveAlphaAbsDate(settings.alphaPensionAbsDate);
  const nuvosAbsDate = resolveAlphaAbsDate(settings.nuvosPensionAbsDate);

  const startingAlphaPortionsAtStartDate =
    calculateStartingAlphaPortionsAtStartDate({
      settings,
      alphaAbsDate,
      accrualStopDate,
    });
  const historicalRows = createHistoricalProjectionRows({
    settings,
    alphaAbsDate,
    drawDate,
    accrualStopDate,
    addedPensionStopDate,
    npaDate,
    epaDate,
    reductionFactor,
    epaReductionFactor,
  });
  let cumulativeStandardAccrual = 0;
  let cumulativeEpaAccrual = 0;
  let cumulativeStandardAddedPension = historicalRows.reduce(
    (total, row) => total + row.monthlyAddedPension + row.lumpSumAddedPension,
    0
  );
  let previousRowDate: string | undefined;

  const projectionRows = generateMonthlyDateRange(
    settings.startDate,
    endDate
  ).map((rowDate) => {
    const sippProjection = calculateSippProjectionRow({
      settings,
      rowDate,
      drawDate: sippDrawDate,
      endDate,
    });
    const isaProjection = calculateIsaProjectionRow({
      settings,
      rowDate,
      drawDate: isaDrawDate,
      endDate,
    });
    const age = calculateAge(settings.dateOfBirth, rowDate);
    const ageMonths = calculateAgeMonths(settings.dateOfBirth, rowDate);
    const monthlyStandardAlphaAccrual =
      rowDate <= accrualStopDate
        ? calculateMonthlyStandardAlphaAccrual(settings, rowDate)
        : 0;
    const monthlyEpaAlphaAccrual =
      rowDate <= accrualStopDate
        ? calculateMonthlyEpaAlphaAccrual(settings, rowDate)
        : 0;

    cumulativeStandardAccrual += monthlyStandardAlphaAccrual;
    cumulativeEpaAccrual += monthlyEpaAlphaAccrual;

    const monthlyAddedPension = settings.showAlpha
      ? calculateMonthlyAddedPension({
          rowDate,
          stopDate: addedPensionStopDate,
          dateOfBirth: settings.dateOfBirth,
          addedPensionMonthlyContribution: settings.alphaAddedPensionMonthly,
          factorType: settings.alphaAddedPensionFactorType,
          contributionMultiplier: getPartialRetirementContributionMultiplier(
            settings,
            rowDate
          ),
        })
      : 0;
    const lumpSumAddedPensionPurchasedThisRow = settings.showAlpha
      ? calculateLumpSumAddedPension({
          rowDate,
          previousRowDate,
          dateOfBirth: settings.dateOfBirth,
          lumpSums: settings.alphaAddedPensionLumpSums,
        })
      : 0;
    cumulativeStandardAddedPension +=
      monthlyAddedPension + lumpSumAddedPensionPurchasedThisRow;
    const annualStandardAlphaPension = calculateAccruedAlphaPension(
      startingAlphaPortionsAtStartDate.standardAlphaPension,
      cumulativeStandardAccrual + cumulativeStandardAddedPension
    );
    const annualEpaAlphaPension =
      startingAlphaPortionsAtStartDate.epaAlphaPension + cumulativeEpaAccrual;
    const annualAccruedAlphaPension =
      annualStandardAlphaPension + annualEpaAlphaPension;
    const annualAlphaPensionIncludingReduction =
      calculateAnnualAlphaPensionIncludingEpaReduction({
        standardAlphaPension: annualStandardAlphaPension,
        epaAlphaPension: annualEpaAlphaPension,
        alphaPensionDrawDate: drawDate,
        npaDate,
        epaDate,
        reductionFactor,
        epaReductionFactor,
      });
    const monthlyAlphaPensionGross = calculateMonthlyAlphaPensionGross(
      rowDate,
      drawDate,
      annualAlphaPensionIncludingReduction
    );
    const annualNuvosPension = calculateAnnualNuvosPensionAtDate({
      settings,
      rowDate,
      nuvosAbsDate,
      accrualStopDate: nuvosAccrualStopDate,
    });
    const annualNuvosPensionIncludingReduction =
      calculateAnnualAlphaPensionIncludingReduction(
        annualNuvosPension,
        nuvosDrawDate,
        nuvosNpaDate,
        nuvosReductionFactor
      );
    const monthlyNuvosPensionGross = calculateMonthlyAlphaPensionGross(
      rowDate,
      nuvosDrawDate,
      annualNuvosPensionIncludingReduction
    );
    const monthlyStatePension = calculateMonthlyStatePension(
      rowDate,
      settings.statePensionDrawDate,
      calculateAnnualStatePensionAtDate(settings, rowDate)
    );
    const totalMonthlyIncomeBeforeTax = calculateTotalGrossMonthlyIncome(
      monthlyAlphaPensionGross,
      monthlyStatePension,
      sippProjection.monthlySippPension,
      isaProjection.monthlyIsaPension,
      monthlyNuvosPensionGross
    );
    const monthlyIncomeTax = calculateMonthlyIncomeTax({
      settings,
      monthlyAlphaPension: monthlyAlphaPensionGross,
      monthlyNuvosPension: monthlyNuvosPensionGross,
      monthlyStatePension,
      monthlySippPension: sippProjection.monthlySippPension,
    });
    const totalMonthlyNetIncome =
      totalMonthlyIncomeBeforeTax - monthlyIncomeTax;

    const projectionRow = {
      date: rowDate,
      age,
      ageMonths,
      monthlyAddedPension,
      lumpSumAddedPension: lumpSumAddedPensionPurchasedThisRow,
      annualStandardAlphaPension,
      annualEpaAlphaPension,
      annualAccruedAlphaPension,
      annualAlphaPensionIncludingReduction,
      monthlyAlphaPensionGross,
      annualNuvosPension,
      annualNuvosPensionIncludingReduction,
      monthlyNuvosPensionGross,
      monthlyStatePension,
      sippPot: sippProjection.sippPot,
      monthlySippPension: sippProjection.monthlySippPension,
      isaPot: isaProjection.isaPot,
      monthlyIsaPension: isaProjection.monthlyIsaPension,
      totalMonthlyIncomeBeforeTax,
      monthlyIncomeTax,
      totalMonthlyNetIncome,
    };

    previousRowDate = rowDate;

    return projectionRow;
  });

  const allRows = [...historicalRows, ...projectionRows];
  const milestoneDefinitions = generateMilestoneDefinitions(
    settings.startDate,
    settings.showAlpha ? accrualStopDate : "",
    settings.showAlpha ? drawDate : "",
    settings.showSipp ? sippDrawDate : "",
    settings.showIsa ? isaDrawDate : "",
    settings.statePensionDrawDate,
    endDate,
    settings.alphaAddedPensionLumpSums,
    alphaAbsDate,
    settings.showSipp ? settings.sippLumpSums : [],
    settings.showIsa ? settings.isaLumpSums : [],
    settings.showStatePension,
    settings.showNuvos ? nuvosAccrualStopDate : "",
    settings.showNuvos ? nuvosDrawDate : "",
    settings.showNuvos ? nuvosAbsDate : "",
    settings.partialRetirementEnabled
      ? getPartialRetirementStartDate(settings)
      : ""
  );
  const milestoneRows = buildMilestoneMapForRowDates(
    milestoneDefinitions,
    allRows.map((row) => row.date)
  );
  const milestoneDateRows = buildMilestoneDateMapForRowDates(
    milestoneDefinitions,
    allRows.map((row) => row.date)
  );

  return allRows.map((row) => ({
    ...row,
    milestones: milestoneRows.get(row.date) ?? [],
    milestoneDates: milestoneDateRows.get(row.date) ?? [],
  }));
}

function createProjectionTableWithPensionIncreases(
  settings: PensionSettings,
  derivedInputs: DerivedProjectionInputs
): ProjectionRow[] {
  const {
    endDate,
    drawDate,
    accrualStopDate,
    nuvosDrawDate,
    nuvosAccrualStopDate,
    nuvosNpaDate,
    nuvosReductionFactor,
    addedPensionStopDate,
    npaDate,
    epaDate,
    reductionFactor,
    epaReductionFactor,
  } = derivedInputs;
  const sippDrawDate = addYears(settings.dateOfBirth, settings.sippDrawAge);
  const isaDrawDate = addYears(settings.dateOfBirth, settings.isaDrawAge);
  const alphaAbsDate = resolveAlphaAbsDate(settings.alphaPensionAbsDate);
  const nuvosAbsDate = resolveAlphaAbsDate(settings.nuvosPensionAbsDate);
  const firstRowDate = minIsoDate(
    minIsoDate(
      alphaAbsDate,
      settings.showNuvos ? nuvosAbsDate : settings.startDate
    ),
    settings.startDate
  );
  const alphaRevaluationTracker = createAlphaRevaluationTracker({
    activeUntilDate: accrualStopDate,
    cpiPercent: getModelledPensionInflationPercent(settings),
    endDate,
  });
  alphaRevaluationTracker.addComponent({
    amount: settings.accruedPensionAtLastAbs,
    startDate: alphaAbsDate,
    portion: "standard",
  });
  let previousRowDate: string | undefined;

  const allRowDates = Array.from(
    new Set([
      ...generateMonthlyDateRange(firstRowDate, endDate),
      settings.startDate,
    ])
  ).sort();

  const allRows = allRowDates.map((rowDate) => {
    const sippProjection =
      rowDate >= settings.startDate
        ? calculateSippProjectionRow({
            settings,
            rowDate,
            drawDate: sippDrawDate,
            endDate,
          })
        : { sippPot: 0, monthlySippPension: 0 };
    const isaProjection =
      rowDate >= settings.startDate
        ? calculateIsaProjectionRow({
            settings,
            rowDate,
            drawDate: isaDrawDate,
            endDate,
          })
        : { isaPot: 0, monthlyIsaPension: 0 };
    const age = calculateAge(settings.dateOfBirth, rowDate);
    const ageMonths = calculateAgeMonths(settings.dateOfBirth, rowDate);
    const shouldShowAbsStatementOnly =
      rowDate === alphaAbsDate && rowDate < settings.startDate;
    const monthlyStandardAlphaAccrual =
      rowDate <= accrualStopDate && !shouldShowAbsStatementOnly
        ? calculateMonthlyStandardAlphaAccrual(settings, rowDate)
        : 0;
    const monthlyEpaAlphaAccrual =
      rowDate <= accrualStopDate && !shouldShowAbsStatementOnly
        ? calculateMonthlyEpaAlphaAccrual(settings, rowDate)
        : 0;

    if (monthlyStandardAlphaAccrual > 0) {
      alphaRevaluationTracker.addComponent({
        amount: monthlyStandardAlphaAccrual,
        startDate: rowDate,
        portion: "standard",
      });
    }

    if (monthlyEpaAlphaAccrual > 0) {
      alphaRevaluationTracker.addComponent({
        amount: monthlyEpaAlphaAccrual,
        startDate: rowDate,
        portion: "epa",
      });
    }

    const monthlyAddedPension =
      shouldShowAbsStatementOnly || !settings.showAlpha
        ? 0
        : calculateMonthlyAddedPension({
            rowDate,
            stopDate: addedPensionStopDate,
            dateOfBirth: settings.dateOfBirth,
            addedPensionMonthlyContribution: settings.alphaAddedPensionMonthly,
            factorType: settings.alphaAddedPensionFactorType,
            contributionMultiplier: getPartialRetirementContributionMultiplier(
              settings,
              rowDate
            ),
          });
    const lumpSumAddedPension = settings.showAlpha
      ? calculateLumpSumAddedPension({
          rowDate,
          previousRowDate,
          dateOfBirth: settings.dateOfBirth,
          lumpSums: settings.alphaAddedPensionLumpSums,
        })
      : 0;

    if (monthlyAddedPension > 0) {
      alphaRevaluationTracker.addComponent({
        amount: monthlyAddedPension,
        startDate: rowDate,
        portion: "standard",
      });
    }

    if (lumpSumAddedPension > 0) {
      alphaRevaluationTracker.addComponent({
        amount: lumpSumAddedPension,
        startDate: rowDate,
        portion: "standard",
      });
    }

    const alphaPortions = alphaRevaluationTracker.getPortionsAt(rowDate);
    const annualStandardAlphaPension = alphaPortions.standardAlphaPension;
    const annualEpaAlphaPension = alphaPortions.epaAlphaPension;
    const annualAccruedAlphaPension =
      annualStandardAlphaPension + annualEpaAlphaPension;
    const annualAlphaPensionIncludingReduction =
      calculateAnnualAlphaPensionIncludingEpaReduction({
        standardAlphaPension: annualStandardAlphaPension,
        epaAlphaPension: annualEpaAlphaPension,
        alphaPensionDrawDate: drawDate,
        npaDate,
        epaDate,
        reductionFactor,
        epaReductionFactor,
      });
    const monthlyAlphaPensionGross = calculateMonthlyAlphaPensionGross(
      rowDate,
      drawDate,
      annualAlphaPensionIncludingReduction
    );
    const annualNuvosPension = calculateAnnualNuvosPensionAtDate({
      settings,
      rowDate,
      nuvosAbsDate,
      accrualStopDate: nuvosAccrualStopDate,
    });
    const annualNuvosPensionIncludingReduction =
      calculateAnnualAlphaPensionIncludingReduction(
        annualNuvosPension,
        nuvosDrawDate,
        nuvosNpaDate,
        nuvosReductionFactor
      );
    const monthlyNuvosPensionGross = calculateMonthlyAlphaPensionGross(
      rowDate,
      nuvosDrawDate,
      annualNuvosPensionIncludingReduction
    );
    const monthlyStatePension = calculateMonthlyStatePension(
      rowDate,
      settings.statePensionDrawDate,
      calculateAnnualStatePensionAtDate(settings, rowDate)
    );

    const totalMonthlyIncomeBeforeTax = calculateTotalGrossMonthlyIncome(
      monthlyAlphaPensionGross,
      monthlyStatePension,
      sippProjection.monthlySippPension,
      isaProjection.monthlyIsaPension,
      monthlyNuvosPensionGross
    );
    const monthlyIncomeTax = calculateMonthlyIncomeTax({
      settings,
      monthlyAlphaPension: monthlyAlphaPensionGross,
      monthlyNuvosPension: monthlyNuvosPensionGross,
      monthlyStatePension,
      monthlySippPension: sippProjection.monthlySippPension,
    });

    previousRowDate = rowDate;

    return {
      date: rowDate,
      age,
      ageMonths,
      monthlyAddedPension,
      lumpSumAddedPension,
      annualStandardAlphaPension,
      annualEpaAlphaPension,
      annualAccruedAlphaPension,
      annualAlphaPensionIncludingReduction,
      monthlyAlphaPensionGross,
      annualNuvosPension,
      annualNuvosPensionIncludingReduction,
      monthlyNuvosPensionGross,
      monthlyStatePension,
      sippPot: sippProjection.sippPot,
      monthlySippPension: sippProjection.monthlySippPension,
      isaPot: isaProjection.isaPot,
      monthlyIsaPension: isaProjection.monthlyIsaPension,
      totalMonthlyIncomeBeforeTax,
      monthlyIncomeTax,
      totalMonthlyNetIncome: totalMonthlyIncomeBeforeTax - monthlyIncomeTax,
    };
  });

  const milestoneDefinitions = generateMilestoneDefinitions(
    settings.startDate,
    settings.showAlpha ? accrualStopDate : "",
    settings.showAlpha ? drawDate : "",
    settings.showSipp ? sippDrawDate : "",
    settings.showIsa ? isaDrawDate : "",
    settings.statePensionDrawDate,
    endDate,
    settings.alphaAddedPensionLumpSums,
    alphaAbsDate,
    settings.showSipp ? settings.sippLumpSums : [],
    settings.showIsa ? settings.isaLumpSums : [],
    settings.showStatePension,
    settings.showNuvos ? nuvosAccrualStopDate : "",
    settings.showNuvos ? nuvosDrawDate : "",
    settings.showNuvos ? nuvosAbsDate : "",
    settings.partialRetirementEnabled
      ? getPartialRetirementStartDate(settings)
      : ""
  );
  const milestoneRows = buildMilestoneMapForRowDates(
    milestoneDefinitions,
    allRowDates
  );
  const milestoneDateRows = buildMilestoneDateMapForRowDates(
    milestoneDefinitions,
    allRowDates
  );

  return allRows.map((row) => ({
    ...row,
    milestones: milestoneRows.get(row.date) ?? [],
    milestoneDates: milestoneDateRows.get(row.date) ?? [],
  }));
}

// eslint-disable-next-line sonarjs/cyclomatic-complexity
export function generatePensionSummary(
  tableData: ProjectionRow[],
  settings: PensionSettings
): PensionSummary {
  const alphaAbsDate = resolveAlphaAbsDate(settings.alphaPensionAbsDate);
  const alphaPensionDrawDate = addYears(
    settings.dateOfBirth,
    settings.alphaPensionDrawAge
  );
  const alphaAccrualStopDate = minIsoDate(
    alphaPensionDrawDate,
    addYears(settings.dateOfBirth, settings.alphaPensionLeaveAge)
  );
  const startingAlphaPortionsAtStartDate =
    calculateStartingAlphaPortionsAtStartDate({
      settings,
      alphaAbsDate,
      accrualStopDate: alphaAccrualStopDate,
    });
  const startingAlphaPensionAtStartDate =
    startingAlphaPortionsAtStartDate.standardAlphaPension +
    startingAlphaPortionsAtStartDate.epaAlphaPension;

  if (tableData.length === 0) {
    const sippDrawDate = addYears(settings.dateOfBirth, settings.sippDrawAge);
    const isaDrawDate = addYears(settings.dateOfBirth, settings.isaDrawAge);
    const nuvosPensionDrawDate = addYears(
      settings.dateOfBirth,
      settings.nuvosPensionDrawAge
    );
    const nuvosAccrualStopDate = minIsoDate(
      nuvosPensionDrawDate,
      addYears(settings.dateOfBirth, settings.nuvosPensionLeaveAge)
    );
    const normalPensionAge = calculateNormalPensionAge(settings.dateOfBirth);
    const npaDate = addYears(settings.dateOfBirth, normalPensionAge);
    const reductionFactor =
      alphaPensionDrawDate > npaDate
        ? 1
        : getEarlyRetirementReductionFactor(
            normalPensionAge,
            settings.alphaPensionDrawAge
          );

    return {
      keyDates: {
        stopsAlphaAccrual: alphaAccrualStopDate,
        startsAlphaPension: alphaPensionDrawDate,
        stopsNuvosAccrual: nuvosAccrualStopDate,
        startsNuvosPension: nuvosPensionDrawDate,
        startsSippDraw: sippDrawDate,
        startsIsaDraw: isaDrawDate,
        startsStatePension: settings.statePensionDrawDate,
      },
      alphaPension: {
        annualAtDraw: 0,
        monthlyAtDraw: 0,
        maximumAnnualAccrued: 0,
        totalAddedAfterToday: 0,
      },
      nuvosPension: {
        annualAtDraw: 0,
        monthlyAtDraw: 0,
        maximumAnnualAccrued: 0,
      },
      sippPension: {
        potAtDraw: 0,
        monthlyAtDraw: 0,
        totalContributionsAfterTaxRelief: 0,
      },
      isaPension: {
        potAtDraw: 0,
        monthlyAtDraw: 0,
        totalContributions: 0,
      },
      incomeOverTime: {
        monthlyAtAlphaStart: 0,
        monthlyAtStateStart: 0,
        monthlyAfterStatePension: 0,
        monthlyStatePension: 0,
      },
      transitions: {
        yearsBetweenStoppingAccrualAndDrawingPension: calculateYearDifference(
          alphaAccrualStopDate,
          alphaPensionDrawDate
        ),
        yearsBetweenAlphaPensionAndStatePension: calculateYearDifference(
          alphaPensionDrawDate,
          settings.statePensionDrawDate
        ),
      },
      calculated: {
        normalPensionAge,
        statePensionAge: calculateAge(
          settings.dateOfBirth,
          settings.statePensionDrawDate
        ),
        earlyRetirementReductionPercent: Math.max(
          0,
          (1 - reductionFactor) * 100
        ),
      },
      retirementIncome: buildRetirementIncomeSummary({
        alphaMonthlyIncome: 0,
        nuvosMonthlyIncome: 0,
        sippMonthlyIncome: 0,
        isaMonthlyIncome: 0,
        statePensionMonthlyIncome: 0,
        monthlyIncomeTax: 0,
        settings,
      }),
    };
  }

  const sippDrawDate = addYears(settings.dateOfBirth, settings.sippDrawAge);
  const isaDrawDate = addYears(settings.dateOfBirth, settings.isaDrawAge);
  const nuvosPensionDrawDate = addYears(
    settings.dateOfBirth,
    settings.nuvosPensionDrawAge
  );
  const nuvosAccrualStopDate = minIsoDate(
    nuvosPensionDrawDate,
    addYears(settings.dateOfBirth, settings.nuvosPensionLeaveAge)
  );
  const statePensionStartDate = settings.statePensionDrawDate;
  const normalPensionAge = calculateNormalPensionAge(settings.dateOfBirth);
  const npaDate = addYears(settings.dateOfBirth, normalPensionAge);
  const reductionFactor =
    alphaPensionDrawDate > npaDate
      ? 1
      : getEarlyRetirementReductionFactor(
          normalPensionAge,
          settings.alphaPensionDrawAge
        );
  const alphaDrawRow =
    findFirstRowAtOrAfterDate(tableData, alphaPensionDrawDate) ??
    tableData.at(-1);
  const nuvosDrawRow =
    findFirstRowAtOrAfterDate(tableData, nuvosPensionDrawDate) ??
    tableData.at(-1);
  const statePensionRow =
    findFirstRowAtOrAfterDate(tableData, statePensionStartDate) ??
    tableData.at(-1);
  const sippDrawRow =
    findFirstRowAtOrAfterDate(tableData, sippDrawDate) ?? tableData.at(-1);
  const isaDrawRow =
    findFirstRowAtOrAfterDate(tableData, isaDrawDate) ?? tableData.at(-1);
  const maximumAnnualAccrued = Math.max(
    ...tableData.map((row) => row.annualAccruedAlphaPension)
  );
  const maximumAnnualNuvosAccrued = settings.showNuvos
    ? Math.max(...tableData.map((row) => row.annualNuvosPension))
    : 0;
  const totalAddedAfterToday =
    maximumAnnualAccrued - startingAlphaPensionAtStartDate;

  return {
    keyDates: {
      stopsAlphaAccrual: alphaAccrualStopDate,
      startsAlphaPension: alphaPensionDrawDate,
      stopsNuvosAccrual: nuvosAccrualStopDate,
      startsNuvosPension: nuvosPensionDrawDate,
      startsSippDraw: sippDrawDate,
      startsIsaDraw: isaDrawDate,
      startsStatePension: statePensionStartDate,
    },
    alphaPension: {
      annualAtDraw: alphaDrawRow?.annualAlphaPensionIncludingReduction ?? 0,
      monthlyAtDraw: alphaDrawRow?.monthlyAlphaPensionGross ?? 0,
      maximumAnnualAccrued,
      totalAddedAfterToday,
    },
    nuvosPension: {
      annualAtDraw: nuvosDrawRow?.annualNuvosPensionIncludingReduction ?? 0,
      monthlyAtDraw: nuvosDrawRow?.monthlyNuvosPensionGross ?? 0,
      maximumAnnualAccrued: maximumAnnualNuvosAccrued,
    },
    sippPension: {
      potAtDraw: sippDrawRow?.sippPot ?? 0,
      monthlyAtDraw: sippDrawRow?.monthlySippPension ?? 0,
      totalContributionsAfterTaxRelief:
        calculateTotalSippContributionsAfterTaxRelief(settings, sippDrawDate),
    },
    isaPension: {
      potAtDraw: isaDrawRow?.isaPot ?? 0,
      monthlyAtDraw: isaDrawRow?.monthlyIsaPension ?? 0,
      totalContributions: calculateTotalIsaContributions(settings, isaDrawDate),
    },
    incomeOverTime: {
      monthlyAtAlphaStart: alphaDrawRow?.totalMonthlyNetIncome ?? 0,
      monthlyAtStateStart: statePensionRow?.totalMonthlyNetIncome ?? 0,
      monthlyAfterStatePension: statePensionRow?.totalMonthlyNetIncome ?? 0,
      monthlyStatePension: statePensionRow?.monthlyStatePension ?? 0,
    },
    transitions: {
      yearsBetweenStoppingAccrualAndDrawingPension: calculateYearDifference(
        alphaAccrualStopDate,
        alphaPensionDrawDate
      ),
      yearsBetweenAlphaPensionAndStatePension: calculateYearDifference(
        alphaPensionDrawDate,
        statePensionStartDate
      ),
    },
    calculated: {
      normalPensionAge,
      statePensionAge: calculateAge(
        settings.dateOfBirth,
        statePensionStartDate
      ),
      earlyRetirementReductionPercent: Math.max(0, (1 - reductionFactor) * 100),
    },
    retirementIncome: buildRetirementIncomeSummary({
      alphaMonthlyIncome: alphaDrawRow?.monthlyAlphaPensionGross ?? 0,
      nuvosMonthlyIncome: nuvosDrawRow?.monthlyNuvosPensionGross ?? 0,
      sippMonthlyIncome: sippDrawRow?.monthlySippPension ?? 0,
      isaMonthlyIncome: isaDrawRow?.monthlyIsaPension ?? 0,
      statePensionMonthlyIncome: statePensionRow?.monthlyStatePension ?? 0,
      monthlyIncomeTax: calculateMonthlyIncomeTax({
        settings,
        monthlyAlphaPension: alphaDrawRow?.monthlyAlphaPensionGross ?? 0,
        monthlyNuvosPension: nuvosDrawRow?.monthlyNuvosPensionGross ?? 0,
        monthlyStatePension: statePensionRow?.monthlyStatePension ?? 0,
        monthlySippPension: sippDrawRow?.monthlySippPension ?? 0,
      }),
      settings,
    }),
  };
}

export function prepareBridgeProjectionSettings(
  settings: PensionSettings
): PensionSettings {
  return prepareBridgeProjectionSettingsDomain(settings);
}

export function generateRetirementBridgeAnalysis(
  pensionRows: ProjectionRow[],
  settings: PensionSettings,
  options: { calculateSafeDrawAge?: boolean } = {}
): RetirementBridgeAnalysis {
  return generateRetirementBridgeAnalysisDomain(pensionRows, settings, options);
}

function buildRetirementIncomeSummary({
  alphaMonthlyIncome,
  nuvosMonthlyIncome,
  sippMonthlyIncome,
  isaMonthlyIncome,
  statePensionMonthlyIncome,
  monthlyIncomeTax,
  settings,
}: {
  alphaMonthlyIncome: number;
  nuvosMonthlyIncome: number;
  sippMonthlyIncome: number;
  isaMonthlyIncome: number;
  statePensionMonthlyIncome: number;
  monthlyIncomeTax: number;
  settings: PensionSettings;
}): RetirementIncomeSummary {
  const sources: RetirementIncomeSource[] = [
    ...(settings.showAlpha
      ? [
          createRetirementIncomeSource(
            "alpha",
            "Alpha pension",
            alphaMonthlyIncome
          ),
        ]
      : []),
    ...(settings.showNuvos
      ? [
          createRetirementIncomeSource(
            "nuvos",
            "nuvos pension",
            nuvosMonthlyIncome
          ),
        ]
      : []),
    ...(settings.showSipp
      ? [createRetirementIncomeSource("sipp", "SIPP", sippMonthlyIncome)]
      : []),
    ...(settings.showIsa
      ? [createRetirementIncomeSource("isa", "ISA", isaMonthlyIncome)]
      : []),
    ...(settings.showStatePension
      ? [
          createRetirementIncomeSource(
            "statePension",
            "State Pension",
            statePensionMonthlyIncome
          ),
        ]
      : []),
    ...(settings.taxationEnabled
      ? [
          createRetirementIncomeSource(
            "incomeTax",
            "Estimated Income Tax",
            -monthlyIncomeTax
          ),
        ]
      : []),
  ];

  const totalMonthlyIncome = sources.reduce(
    (total, source) => total + source.monthlyIncome,
    0
  );

  return {
    sources,
    totalMonthlyIncome,
    totalAnnualIncome: totalMonthlyIncome * 12,
  };
}

function createRetirementIncomeSource(
  key: RetirementIncomeSource["key"],
  label: string,
  monthlyIncome: number
): RetirementIncomeSource {
  return {
    key,
    label,
    monthlyIncome,
    annualIncome: monthlyIncome * 12,
  };
}

export function generateMonthlyDateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(currentDate);
    currentDate = addMonths(currentDate, 1);
  }

  if (dates.at(-1) !== endDate) {
    dates.push(endDate);
  }

  return dates;
}

export function getLifeExpectancyDate(
  dateOfBirth: string,
  lifeExpectancyAge: number
) {
  return addYears(dateOfBirth, lifeExpectancyAge);
}

export function calculateAge(dateOfBirth: string, rowDate: string) {
  const birth = parseIsoDate(dateOfBirth);
  const row = parseIsoDate(rowDate);

  let age = row.getUTCFullYear() - birth.getUTCFullYear();
  const hasHadBirthday =
    row.getUTCMonth() > birth.getUTCMonth() ||
    (row.getUTCMonth() === birth.getUTCMonth() &&
      row.getUTCDate() >= birth.getUTCDate());

  if (!hasHadBirthday) {
    age -= 1;
  }

  return age;
}

export function calculateAgeMonths(dateOfBirth: string, rowDate: string) {
  const birth = parseIsoDate(dateOfBirth);
  const row = parseIsoDate(rowDate);

  let months =
    (row.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    (row.getUTCMonth() - birth.getUTCMonth());

  if (row.getUTCDate() < birth.getUTCDate()) {
    months -= 1;
  }

  return Math.max(0, months % 12);
}

function calculateStartingAlphaPortionsAtStartDate(input: {
  settings: PensionSettings;
  alphaAbsDate: string;
  accrualStopDate: string;
}) {
  const { settings, alphaAbsDate, accrualStopDate } = input;

  if (!settings.showAlpha) {
    return {
      standardAlphaPension: 0,
      epaAlphaPension: 0,
    };
  }

  if (alphaAbsDate >= settings.startDate) {
    return {
      standardAlphaPension: settings.accruedPensionAtLastAbs,
      epaAlphaPension: 0,
    };
  }

  let standardAlphaPension = settings.accruedPensionAtLastAbs;
  let epaAlphaPension = 0;
  let rowDate = addMonths(alphaAbsDate, 1);

  while (rowDate <= settings.startDate && rowDate <= accrualStopDate) {
    standardAlphaPension += calculateMonthlyStandardAlphaAccrual(
      settings,
      rowDate
    );
    epaAlphaPension += calculateMonthlyEpaAlphaAccrual(settings, rowDate);
    rowDate = addMonths(rowDate, 1);
  }

  return {
    standardAlphaPension,
    epaAlphaPension,
  };
}

function createAlphaRevaluationTracker(input: {
  activeUntilDate: string;
  cpiPercent: number;
  endDate: string;
}) {
  const { activeUntilDate, cpiPercent, endDate } = input;
  const cpiRate = cpiPercent / 100;
  const activeRate = cpiRate + ALPHA_IN_SERVICE_REVALUATION_UPLIFT_RATE;
  const events: AlphaRevaluationEvent[] = [];
  const totals = {
    standardAlphaPension: 0,
    epaAlphaPension: 0,
  };

  return {
    addComponent(component: {
      amount: number;
      startDate: string;
      portion: AlphaBenefitPortion;
    }) {
      if (component.amount <= 0) {
        return;
      }

      addAmountToAlphaPortionTotals(
        totals,
        component.portion,
        component.amount
      );
      scheduleAlphaRevaluationEvent(events, {
        amount: component.amount,
        dueDate: addYears(component.startDate, 1),
        portion: component.portion,
      });
    },
    getPortionsAt(rowDate: string) {
      applyDueAlphaRevaluationEvents({
        events,
        totals,
        rowDate,
        endDate,
        activeUntilDate,
        cpiRate,
        activeRate,
      });

      return { ...totals };
    },
  };
}

function applyDueAlphaRevaluationEvents(input: {
  events: AlphaRevaluationEvent[];
  totals: {
    standardAlphaPension: number;
    epaAlphaPension: number;
  };
  rowDate: string;
  endDate: string;
  activeUntilDate: string;
  cpiRate: number;
  activeRate: number;
}) {
  const {
    events,
    totals,
    rowDate,
    endDate,
    activeUntilDate,
    cpiRate,
    activeRate,
  } = input;

  while (events[0] && events[0].dueDate <= rowDate) {
    const event = popNextAlphaRevaluationEvent(events);
    const revaluationRate =
      event.dueDate <= activeUntilDate ? activeRate : cpiRate;
    const revaluedAmount = event.amount * (1 + revaluationRate);
    const revaluationIncrease = revaluedAmount - event.amount;

    addAmountToAlphaPortionTotals(totals, event.portion, revaluationIncrease);

    const nextDueDate = addYears(event.dueDate, 1);
    if (nextDueDate <= endDate) {
      scheduleAlphaRevaluationEvent(events, {
        ...event,
        amount: revaluedAmount,
        dueDate: nextDueDate,
      });
    }
  }
}

function addAmountToAlphaPortionTotals(
  totals: {
    standardAlphaPension: number;
    epaAlphaPension: number;
  },
  portion: AlphaBenefitPortion,
  amount: number
) {
  if (portion === "epa") {
    totals.epaAlphaPension += amount;
    return;
  }

  totals.standardAlphaPension += amount;
}

function scheduleAlphaRevaluationEvent(
  events: AlphaRevaluationEvent[],
  event: AlphaRevaluationEvent
) {
  events.push(event);
  siftAlphaRevaluationEventUp(events, events.length - 1);
}

function popNextAlphaRevaluationEvent(events: AlphaRevaluationEvent[]) {
  const nextEvent = events[0];
  const lastEvent = events.pop();

  if (!nextEvent || !lastEvent) {
    throw new Error(
      "Cannot pop an Alpha revaluation event from an empty queue."
    );
  }

  if (events.length > 0) {
    events[0] = lastEvent;
    siftAlphaRevaluationEventDown(events, 0);
  }

  return nextEvent;
}

function siftAlphaRevaluationEventUp(
  events: AlphaRevaluationEvent[],
  index: number
) {
  let childIndex = index;

  while (childIndex > 0) {
    const parentIndex = Math.floor((childIndex - 1) / 2);

    if (events[parentIndex].dueDate <= events[childIndex].dueDate) {
      return;
    }

    [events[parentIndex], events[childIndex]] = [
      events[childIndex],
      events[parentIndex],
    ];
    childIndex = parentIndex;
  }
}

function siftAlphaRevaluationEventDown(
  events: AlphaRevaluationEvent[],
  index: number
) {
  let parentIndex = index;

  while (true) {
    const leftIndex = parentIndex * 2 + 1;
    const rightIndex = leftIndex + 1;
    let earliestIndex = parentIndex;

    if (
      leftIndex < events.length &&
      events[leftIndex].dueDate < events[earliestIndex].dueDate
    ) {
      earliestIndex = leftIndex;
    }

    if (
      rightIndex < events.length &&
      events[rightIndex].dueDate < events[earliestIndex].dueDate
    ) {
      earliestIndex = rightIndex;
    }

    if (earliestIndex === parentIndex) {
      return;
    }

    [events[parentIndex], events[earliestIndex]] = [
      events[earliestIndex],
      events[parentIndex],
    ];
    parentIndex = earliestIndex;
  }
}

export function calculateTotalGrossMonthlyIncome(
  monthlyAlphaPensionIncludingReduction: number,
  monthlyStatePension: number,
  monthlySippPension = 0,
  monthlyIsaPension = 0,
  monthlyNuvosPensionIncludingReduction = 0
) {
  return (
    monthlyAlphaPensionIncludingReduction +
    monthlyNuvosPensionIncludingReduction +
    monthlyStatePension +
    monthlySippPension +
    monthlyIsaPension
  );
}

export function generateMilestoneDefinitions(
  startDate: string,
  alphaPensionStopDate: string,
  alphaPensionDrawDate: string,
  sippDrawDate: string,
  isaDrawDate: string,
  statePensionStartDate: string,
  lifeExpectancyDate: string,
  lumpSums: AddedPensionLumpSum[] = [],
  alphaAbsDate?: string,
  sippLumpSums: AddedPensionLumpSum[] = [],
  isaLumpSums: AddedPensionLumpSum[] = [],
  includeStatePension = true,
  nuvosPensionStopDate = "",
  nuvosPensionDrawDate = "",
  nuvosAbsDate = "",
  partialRetirementStartDate = ""
): MilestoneDefinition[] {
  return [
    ...(alphaAbsDate
      ? [{ date: alphaAbsDate, label: LAST_ABS_STATEMENT_LABEL }]
      : []),
    ...(nuvosAbsDate ? [{ date: nuvosAbsDate, label: "Last nuvos ABS" }] : []),
    { date: startDate, label: CALCULATION_START_LABEL },
    ...(alphaPensionStopDate
      ? [{ date: alphaPensionStopDate, label: STOPS_ALPHA_ACCRUAL_LABEL }]
      : []),
    ...(alphaPensionDrawDate
      ? [{ date: alphaPensionDrawDate, label: STARTS_ALPHA_PENSION_LABEL }]
      : []),
    ...(nuvosPensionStopDate
      ? [{ date: nuvosPensionStopDate, label: STOPS_NUVOS_ACCRUAL_LABEL }]
      : []),
    ...(nuvosPensionDrawDate
      ? [{ date: nuvosPensionDrawDate, label: STARTS_NUVOS_PENSION_LABEL }]
      : []),
    ...(sippDrawDate ? [{ date: sippDrawDate, label: STARTS_SIPP_LABEL }] : []),
    ...(isaDrawDate ? [{ date: isaDrawDate, label: STARTS_ISA_LABEL }] : []),
    ...(includeStatePension
      ? [{ date: statePensionStartDate, label: STARTS_STATE_PENSION_LABEL }]
      : []),
    ...(partialRetirementStartDate
      ? [
          {
            date: partialRetirementStartDate,
            label: STARTS_PARTIAL_RETIREMENT_LABEL,
          },
        ]
      : []),
    { date: lifeExpectancyDate, label: LIFE_EXPECTANCY_LABEL },
    ...generateLumpSumMilestoneDefinitions(lumpSums),
    ...generateSippLumpSumMilestoneDefinitions(sippLumpSums),
    ...generateIsaLumpSumMilestoneDefinitions(isaLumpSums),
  ];
}

export function buildMilestoneMap(
  milestones: MilestoneDefinition[],
  startDate: string,
  endDate: string
) {
  return buildMilestoneMapForRowDates(
    milestones,
    generateMonthlyDateRange(startDate, endDate)
  );
}

export function addYears(date: string, years: number) {
  return addMonths(date, Math.round(years * 12));
}

export function addMonths(date: string, months: number) {
  const parsed = parseIsoDate(date);
  const monthIndex = parsed.getUTCMonth() + months;
  const year = parsed.getUTCFullYear() + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  const day = Math.min(parsed.getUTCDate(), getDaysInMonth(year, month));

  return formatIsoDate(new Date(Date.UTC(year, month, day)));
}

function getScheduledPaymentDates(lumpSum: AddedPensionLumpSum) {
  const dates: string[] = [];
  let scheduledDate = lumpSum.startDate;

  while (scheduledDate <= lumpSum.endDate) {
    dates.push(scheduledDate);

    if (lumpSum.cadence === "once") {
      break;
    }

    scheduledDate = addYears(scheduledDate, 1);
  }

  return dates;
}

function generateLumpSumMilestoneDefinitions(lumpSums: AddedPensionLumpSum[]) {
  return lumpSums.flatMap((lumpSum) =>
    getScheduledPaymentDates(lumpSum).map((date) => ({
      date,
      label: formatLumpSumMilestoneLabel(lumpSum.amount),
    }))
  );
}

function generateSippLumpSumMilestoneDefinitions(
  lumpSums: AddedPensionLumpSum[]
) {
  return lumpSums.flatMap((lumpSum) =>
    getScheduledPaymentDates(lumpSum).map((date) => ({
      date,
      label: formatSippLumpSumMilestoneLabel(lumpSum.amount),
    }))
  );
}

function generateIsaLumpSumMilestoneDefinitions(
  lumpSums: AddedPensionLumpSum[]
) {
  return lumpSums.flatMap((lumpSum) =>
    getScheduledPaymentDates(lumpSum).map((date) => ({
      date,
      label: formatIsaLumpSumMilestoneLabel(lumpSum.amount),
    }))
  );
}

function formatLumpSumMilestoneLabel(amount: number) {
  return `${LUMP_SUM_ADDED_PENSION_LABEL} (${formatWholeCurrency(amount)})`;
}

function formatSippLumpSumMilestoneLabel(amount: number) {
  return `${SIPP_LUMP_SUM_LABEL} (${formatWholeCurrency(amount)})`;
}

function formatIsaLumpSumMilestoneLabel(amount: number) {
  return `${ISA_LUMP_SUM_LABEL} (${formatWholeCurrency(amount)})`;
}

function formatWholeCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function minIsoDate(firstDate: string, secondDate: string) {
  return firstDate <= secondDate ? firstDate : secondDate;
}

function createHistoricalProjectionRows(input: {
  settings: PensionSettings;
  alphaAbsDate: string;
  drawDate: string;
  accrualStopDate: string;
  addedPensionStopDate: string;
  npaDate: string;
  epaDate: string;
  reductionFactor: number;
  epaReductionFactor: number;
}) {
  const {
    settings,
    alphaAbsDate,
    drawDate,
    accrualStopDate,
    addedPensionStopDate,
    npaDate,
    epaDate,
    reductionFactor,
    epaReductionFactor,
  } = input;

  if (alphaAbsDate >= settings.startDate) {
    return [];
  }

  const rows: ProjectionRowWithoutMilestones[] = [];
  let rowDate = alphaAbsDate;
  let previousRowDate: string | undefined;
  let cumulativeLumpSumAddedPension = 0;
  let cumulativeStandardAlphaPension = settings.accruedPensionAtLastAbs;
  let cumulativeEpaAlphaPension = 0;

  while (rowDate < settings.startDate) {
    const age = calculateAge(settings.dateOfBirth, rowDate);
    const ageMonths = calculateAgeMonths(settings.dateOfBirth, rowDate);
    const monthlyAddedPension =
      rowDate === alphaAbsDate || !settings.showAlpha
        ? 0
        : calculateMonthlyAddedPension({
            rowDate,
            stopDate: addedPensionStopDate,
            dateOfBirth: settings.dateOfBirth,
            addedPensionMonthlyContribution: settings.alphaAddedPensionMonthly,
            factorType: settings.alphaAddedPensionFactorType,
            contributionMultiplier: getPartialRetirementContributionMultiplier(
              settings,
              rowDate
            ),
          });
    const lumpSumAddedPension = settings.showAlpha
      ? calculateLumpSumAddedPension({
          rowDate,
          previousRowDate,
          dateOfBirth: settings.dateOfBirth,
          lumpSums: settings.alphaAddedPensionLumpSums,
        })
      : 0;
    cumulativeLumpSumAddedPension += monthlyAddedPension + lumpSumAddedPension;
    if (rowDate > alphaAbsDate && rowDate <= accrualStopDate) {
      cumulativeStandardAlphaPension += calculateMonthlyStandardAlphaAccrual(
        settings,
        rowDate
      );
      cumulativeEpaAlphaPension += calculateMonthlyEpaAlphaAccrual(
        settings,
        rowDate
      );
    }
    const annualAccruedAlphaPensionIncludingLumpSums =
      cumulativeStandardAlphaPension +
      cumulativeEpaAlphaPension +
      cumulativeLumpSumAddedPension;
    const annualStandardAlphaPension =
      cumulativeStandardAlphaPension + cumulativeLumpSumAddedPension;
    const annualEpaAlphaPension = cumulativeEpaAlphaPension;
    const annualAlphaPensionIncludingReduction =
      calculateAnnualAlphaPensionIncludingEpaReduction({
        standardAlphaPension: annualStandardAlphaPension,
        epaAlphaPension: annualEpaAlphaPension,
        alphaPensionDrawDate: drawDate,
        npaDate,
        epaDate,
        reductionFactor,
        epaReductionFactor,
      });
    const monthlyAlphaPensionGross = calculateMonthlyAlphaPensionGross(
      rowDate,
      drawDate,
      annualAlphaPensionIncludingReduction
    );
    const monthlyStatePension = calculateMonthlyStatePension(
      rowDate,
      settings.statePensionDrawDate,
      calculateAnnualStatePensionAtDate(settings, rowDate)
    );
    const totalMonthlyIncomeBeforeTax = calculateTotalGrossMonthlyIncome(
      monthlyAlphaPensionGross,
      monthlyStatePension
    );
    const monthlyIncomeTax = calculateMonthlyIncomeTax({
      settings,
      monthlyAlphaPension: monthlyAlphaPensionGross,
      monthlyNuvosPension: 0,
      monthlyStatePension,
      monthlySippPension: 0,
    });

    rows.push({
      date: rowDate,
      age,
      ageMonths,
      monthlyAddedPension,
      lumpSumAddedPension,
      annualStandardAlphaPension,
      annualEpaAlphaPension,
      annualAccruedAlphaPension: annualAccruedAlphaPensionIncludingLumpSums,
      annualAlphaPensionIncludingReduction,
      monthlyAlphaPensionGross,
      annualNuvosPension: 0,
      annualNuvosPensionIncludingReduction: 0,
      monthlyNuvosPensionGross: 0,
      monthlyStatePension,
      sippPot: 0,
      monthlySippPension: 0,
      isaPot: 0,
      monthlyIsaPension: 0,
      totalMonthlyIncomeBeforeTax,
      monthlyIncomeTax,
      totalMonthlyNetIncome: totalMonthlyIncomeBeforeTax - monthlyIncomeTax,
    });

    previousRowDate = rowDate;
    rowDate = addMonths(rowDate, 1);
  }

  return rows;
}

function buildMilestoneMapForRowDates(
  milestones: MilestoneDefinition[],
  rows: string[]
) {
  const milestoneMap = new Map<string, string[]>();

  for (const milestone of milestones) {
    const matchingRowDate = rows.find((rowDate) => rowDate >= milestone.date);

    if (!matchingRowDate) {
      continue;
    }

    const existingMilestones = milestoneMap.get(matchingRowDate) ?? [];
    milestoneMap.set(matchingRowDate, [...existingMilestones, milestone.label]);
  }

  return milestoneMap;
}

function buildMilestoneDateMapForRowDates(
  milestones: MilestoneDefinition[],
  rows: string[]
) {
  const milestoneMap = new Map<string, string[]>();

  for (const milestone of milestones) {
    const matchingRowDate = rows.find((rowDate) => rowDate >= milestone.date);

    if (!matchingRowDate) {
      continue;
    }

    const existingMilestones = milestoneMap.get(matchingRowDate) ?? [];
    milestoneMap.set(matchingRowDate, [...existingMilestones, milestone.date]);
  }

  return milestoneMap;
}

function findFirstRowAtOrAfterDate(
  tableData: ProjectionRow[],
  milestoneDate: string
) {
  return tableData.find((row) => row.date >= milestoneDate);
}

function calculateYearDifference(startDate: string, endDate: string) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const monthDifference =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  const dayAdjustment = (end.getUTCDate() - start.getUTCDate()) / 30;

  return Number(((monthDifference + dayAdjustment) / 12).toFixed(1));
}

export function calculateWholeMonthDifference(
  startDate: string,
  endDate: string
) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const monthDifference =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());

  return Math.max(0, monthDifference);
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}
