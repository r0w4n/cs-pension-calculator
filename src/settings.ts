export const SETTINGS_STORAGE_KEY = "cs-pension-calculator.settings";

export type PensionSettings = {
  startDate: string;
  dateOfBirth: string;
  lifeExpectancy: number;
  normalPensionAge: number;
  earlyRetirementAge: number;
  currentStatePension: number;
  statePensionDrawDate: string;
  alphaPensionAbsDate: string;
  alphaAddedPensionMonthly: number;
  alphaPensionLeaveAge: number;
  accruedPensionAtLastAbs: number;
  pensionableEarnings: number;
  alphaPensionDrawAge: number;
};

type StoredPensionSettings = Omit<PensionSettings, "startDate">;

const numericSettingRules = {
  lifeExpectancy: { min: 75, max: 100, step: 1 },
  normalPensionAge: { min: 65, max: 70, step: 1 },
  earlyRetirementAge: { min: 55, max: 85, step: 1 },
  currentStatePension: { min: 0, max: 15000, step: 50 },
  alphaAddedPensionMonthly: { min: 0, max: 1000, step: 25 },
  alphaPensionLeaveAge: { min: 55, max: 85, step: 1 },
  accruedPensionAtLastAbs: { min: 0, max: 50000, step: 250 },
  pensionableEarnings: { min: 10000, max: 150000, step: 500 },
  alphaPensionDrawAge: { min: 55, max: 85, step: 1 },
} as const;

type NumericSettingKey = keyof typeof numericSettingRules;

export const defaultSettings: PensionSettings = {
  startDate: getTodayIsoDate(),
  dateOfBirth: "1987-06-15",
  lifeExpectancy: 88,
  normalPensionAge: 68,
  earlyRetirementAge: 60,
  currentStatePension: 11500,
  statePensionDrawDate: "2055-06-15",
  alphaPensionAbsDate: "2025-03-31",
  alphaAddedPensionMonthly: 150,
  alphaPensionLeaveAge: 60,
  accruedPensionAtLastAbs: 8250,
  pensionableEarnings: 42000,
  alphaPensionDrawAge: 60,
};

export function loadStoredSettings(): PensionSettings {
  const defaults = createDefaultSettings();

  if (typeof window === "undefined") {
    return defaults;
  }

  const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!stored) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StoredPensionSettings>;

    return normalizeSettings({
      ...defaults,
      ...coerceSettings(parsed),
    });
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: PensionSettings) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedSettings = normalizeSettings(settings);
  const { startDate: _startDate, ...storedSettings } = normalizedSettings;

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(storedSettings));
}

export function normalizeSetting<K extends keyof PensionSettings>(
  key: K,
  value: PensionSettings[K],
): PensionSettings[K] {
  switch (key) {
    case "startDate":
      return normalizeDate(value as string, getTodayIsoDate()) as PensionSettings[K];
    case "dateOfBirth":
      return normalizeDate(value as string, defaultSettings.dateOfBirth) as PensionSettings[K];
    case "statePensionDrawDate":
      return normalizeDate(
        value as string,
        defaultSettings.statePensionDrawDate,
      ) as PensionSettings[K];
    case "alphaPensionAbsDate":
      return normalizeDate(
        value as string,
        defaultSettings.alphaPensionAbsDate,
      ) as PensionSettings[K];
    default:
      return normalizeNumericSetting(key as NumericSettingKey, value) as PensionSettings[K];
  }
}

function coerceSettings(
  input: Partial<StoredPensionSettings>,
): Partial<StoredPensionSettings> {
  return {
    dateOfBirth: coerceString(input.dateOfBirth),
    lifeExpectancy: coerceNumber(input.lifeExpectancy),
    normalPensionAge: coerceNumber(input.normalPensionAge),
    earlyRetirementAge: coerceNumber(input.earlyRetirementAge),
    currentStatePension: coerceNumber(input.currentStatePension),
    statePensionDrawDate: coerceString(input.statePensionDrawDate),
    alphaPensionAbsDate: coerceString(input.alphaPensionAbsDate),
    alphaAddedPensionMonthly: coerceNumber(input.alphaAddedPensionMonthly),
    alphaPensionLeaveAge: coerceNumber(input.alphaPensionLeaveAge),
    accruedPensionAtLastAbs: coerceNumber(input.accruedPensionAtLastAbs),
    pensionableEarnings: coerceNumber(input.pensionableEarnings),
    alphaPensionDrawAge: coerceNumber(input.alphaPensionDrawAge),
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function coerceNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function coerceString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export function createDefaultSettings(): PensionSettings {
  return {
    ...defaultSettings,
    startDate: getTodayIsoDate(),
  };
}

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeSettings(settings: PensionSettings): PensionSettings {
  return {
    startDate: normalizeSetting("startDate", settings.startDate),
    dateOfBirth: normalizeSetting("dateOfBirth", settings.dateOfBirth),
    lifeExpectancy: normalizeSetting("lifeExpectancy", settings.lifeExpectancy),
    normalPensionAge: normalizeSetting("normalPensionAge", settings.normalPensionAge),
    earlyRetirementAge: normalizeSetting("earlyRetirementAge", settings.earlyRetirementAge),
    currentStatePension: normalizeSetting(
      "currentStatePension",
      settings.currentStatePension,
    ),
    statePensionDrawDate: normalizeSetting(
      "statePensionDrawDate",
      settings.statePensionDrawDate,
    ),
    alphaPensionAbsDate: normalizeSetting(
      "alphaPensionAbsDate",
      settings.alphaPensionAbsDate,
    ),
    alphaAddedPensionMonthly: normalizeSetting(
      "alphaAddedPensionMonthly",
      settings.alphaAddedPensionMonthly,
    ),
    alphaPensionLeaveAge: normalizeSetting(
      "alphaPensionLeaveAge",
      settings.alphaPensionLeaveAge,
    ),
    accruedPensionAtLastAbs: normalizeSetting(
      "accruedPensionAtLastAbs",
      settings.accruedPensionAtLastAbs,
    ),
    pensionableEarnings: normalizeSetting(
      "pensionableEarnings",
      settings.pensionableEarnings,
    ),
    alphaPensionDrawAge: normalizeSetting(
      "alphaPensionDrawAge",
      settings.alphaPensionDrawAge,
    ),
  };
}

function normalizeNumericSetting(key: NumericSettingKey, value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return defaultSettings[key];
  }

  const { min, max, step } = numericSettingRules[key];
  const clamped = Math.min(max, Math.max(min, parsed));
  const snapped = Math.round((clamped - min) / step) * step + min;

  return Math.min(max, Math.max(min, snapped));
}

function normalizeDate(value: string, fallback: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fallback;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : value;
}
