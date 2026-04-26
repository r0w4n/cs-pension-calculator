import {
  SETTINGS_STORAGE_KEY,
  createDefaultSettings,
  defaultSettings,
  getTodayIsoDate,
  isValidIsoDate,
  loadStoredSettings,
  normalizeSetting,
  saveSettings,
  validateSettings,
  type PensionSettings,
} from "./settings";

describe("settings unit tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T12:00:00Z"));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses today for the default calculation start date", () => {
    expect(getTodayIsoDate()).toBe("2026-04-25");
    expect(createDefaultSettings().startDate).toBe("2026-04-25");
  });

  it("normalizes numeric settings to allowed ranges and steps", () => {
    expect(normalizeSetting("lifeExpectancy", 120)).toBe(100);
    expect(normalizeSetting("normalPensionAge", 120)).toBe(68);
    expect(normalizeSetting("earlyRetirementAge", 40)).toBe(45);
    expect(normalizeSetting("currentStatePension", -10)).toBe(0);
    expect(normalizeSetting("alphaAddedPensionMonthly", 233)).toBe(225);
    expect(normalizeSetting("pensionableEarnings", 56321)).toBe(56500);
    expect(normalizeSetting("alphaPensionLeaveAge", 20)).toBe(40);
    expect(normalizeSetting("alphaPensionDrawAge", 200)).toBe(70);
  });

  it("normalizes invalid dates back to defaults", () => {
    expect(normalizeSetting("startDate", "not-a-date")).toBe("2026-04-25");
    expect(normalizeSetting("dateOfBirth", "2026-99-99")).toBe(defaultSettings.dateOfBirth);
    expect(normalizeSetting("dateOfBirth", "2026-02-31")).toBe(defaultSettings.dateOfBirth);
    expect(normalizeSetting("statePensionDrawDate", "")).toBe(
      defaultSettings.statePensionDrawDate,
    );
  });

  it("rejects impossible calendar dates during strict validation", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    expect(isValidIsoDate("2026-02-31")).toBe(false);
    expect(isValidIsoDate("2025-02-29")).toBe(false);
  });

  it("does not persist the calculation start date", () => {
    const settings: PensionSettings = {
      ...createDefaultSettings(),
      startDate: "2026-05-01",
      alphaAddedPensionMonthly: 233,
    };

    saveSettings(settings);

    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}")).toEqual({
      dateOfBirth: defaultSettings.dateOfBirth,
      lifeExpectancy: defaultSettings.lifeExpectancy,
      normalPensionAge: defaultSettings.normalPensionAge,
      earlyRetirementAge: defaultSettings.earlyRetirementAge,
      currentStatePension: defaultSettings.currentStatePension,
      statePensionDrawDate: defaultSettings.statePensionDrawDate,
      alphaPensionAbsDate: defaultSettings.alphaPensionAbsDate,
      alphaAddedPensionMonthly: 225,
      alphaPensionLeaveAge: defaultSettings.alphaPensionLeaveAge,
      accruedPensionAtLastAbs: defaultSettings.accruedPensionAtLastAbs,
      pensionableEarnings: defaultSettings.pensionableEarnings,
      alphaPensionDrawAge: defaultSettings.alphaPensionDrawAge,
    });
  });

  it("normalizes unexpected stored settings when loading", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        dateOfBirth: "bad-date",
        lifeExpectancy: 120,
        normalPensionAge: 120,
        earlyRetirementAge: 40,
        currentStatePension: -10,
        statePensionDrawDate: "bad-date",
        alphaPensionAbsDate: "bad-date",
        alphaAddedPensionMonthly: 233,
        alphaPensionLeaveAge: 10,
        accruedPensionAtLastAbs: 12444,
        pensionableEarnings: 56321,
        alphaPensionDrawAge: 200,
      }),
    );

    expect(loadStoredSettings()).toEqual({
      startDate: "2026-04-25",
      dateOfBirth: defaultSettings.dateOfBirth,
      lifeExpectancy: 100,
      normalPensionAge: 68,
      earlyRetirementAge: 45,
      currentStatePension: 0,
      statePensionDrawDate: defaultSettings.statePensionDrawDate,
      alphaPensionAbsDate: defaultSettings.alphaPensionAbsDate,
      alphaAddedPensionMonthly: 225,
      alphaPensionLeaveAge: 40,
      accruedPensionAtLastAbs: 12500,
      pensionableEarnings: 56500,
      alphaPensionDrawAge: 70,
    });
  });

  it("falls back to defaults when stored JSON is invalid", () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, "{not-json");

    expect(loadStoredSettings()).toEqual(createDefaultSettings());
  });

  it("reports relational validation issues for inconsistent pension settings", () => {
    const issues = validateSettings({
      ...defaultSettings,
      startDate: "2076-01-01",
      alphaPensionAbsDate: "2076-02-01",
      earlyRetirementAge: 62,
      alphaPensionDrawAge: 60,
      statePensionDrawDate: "2046-01-01",
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "startDate" }),
        expect.objectContaining({ field: "alphaPensionAbsDate" }),
        expect.objectContaining({ field: "alphaPensionDrawAge" }),
        expect.objectContaining({ field: "statePensionDrawDate" }),
      ]),
    );
  });
});
