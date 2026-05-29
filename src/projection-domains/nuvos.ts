import {
  getPartialRetirementContributionMultiplier,
  type PensionSettings,
} from "../settings";

const MONTHLY_NUVOS_ACCRUAL_RATE = 0.023 / 12;

export function calculateAnnualNuvosPensionAtDate(input: {
  settings: PensionSettings;
  rowDate: string;
  nuvosAbsDate: string;
  accrualStopDate: string;
}) {
  const { settings, rowDate, nuvosAbsDate, accrualStopDate } = input;

  if (!settings.showNuvos || rowDate < nuvosAbsDate) {
    return 0;
  }

  const benefitComponents: { amount: number; startDate: string }[] = [
    {
      amount: settings.nuvosAccruedPensionAtLastAbs,
      startDate: nuvosAbsDate,
    },
  ];
  let accrualDate = addMonths(nuvosAbsDate, 1);

  while (accrualDate <= rowDate && accrualDate <= accrualStopDate) {
    benefitComponents.push({
      amount: calculateMonthlyNuvosAccrual(settings, accrualDate),
      startDate: accrualDate,
    });
    accrualDate = addMonths(accrualDate, 1);
  }

  return benefitComponents.reduce((total, component) => {
    const revaluationFactor = settings.nuvosApplyPensionIncreases
      ? calculateNuvosPensionRevaluationFactor({
          fromDate: component.startDate,
          rowDate,
          cpiPercent: settings.projectionBasis === "real" ? 0 : settings.inflationRateAnnual,
        })
      : 1;

    return total + component.amount * revaluationFactor;
  }, 0);
}

export function calculateNuvosPensionRevaluationFactor(input: {
  fromDate: string;
  rowDate: string;
  cpiPercent: number;
}) {
  const { fromDate, rowDate, cpiPercent } = input;
  const cpiRate = cpiPercent / 100;
  const totalYears = calculateWholeYearDifference(fromDate, rowDate);

  return (1 + cpiRate) ** totalYears;
}

function calculateMonthlyNuvosAccrual(settings: PensionSettings, rowDate: string) {
  if (!settings.showNuvos) {
    return 0;
  }

  return (
    settings.nuvosPensionableEarnings *
    MONTHLY_NUVOS_ACCRUAL_RATE *
    getPartialRetirementContributionMultiplier(settings, rowDate)
  );
}

function addMonths(date: string, months: number) {
  const parsed = parseIsoDate(date);
  const monthIndex = parsed.getUTCMonth() + months;
  const year = parsed.getUTCFullYear() + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  const day = Math.min(parsed.getUTCDate(), getDaysInMonth(year, month));

  return formatIsoDate(new Date(Date.UTC(year, month, day)));
}

function calculateWholeYearDifference(startDate: string, endDate: string) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  let yearDifference = endYear - startYear;

  if (endMonth < startMonth || (endMonth === startMonth && endDay < startDay)) {
    yearDifference -= 1;
  }

  return Math.max(0, yearDifference);
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}
