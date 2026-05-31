import { describe, expect, it } from "vitest";
import {
  calculateAnnualStatePensionAtDate,
  calculateAnnualStatePensionAtDraw,
  calculateMonthlyStatePension,
  calculateStatePensionDeferralIncreasePercent,
} from "./state-pension";
import { defaultSettings } from "../settings";

describe("projection state pension domain", () => {
  it("starts state pension from the configured state pension date", () => {
    expect(
      calculateMonthlyStatePension("2055-06-14", "2055-06-15", 11500)
    ).toBe(0);
    expect(
      calculateMonthlyStatePension("2055-06-15", "2055-06-15", 11500)
    ).toBeCloseTo(958.333333, 6);
  });

  it("projects State Pension future growth using the highest triple-lock input", () => {
    expect(
      calculateAnnualStatePensionAtDraw({
        ...defaultSettings,
        projectionBasis: "nominal",
        startDate: "2026-01-01",
        statePensionDrawDate: "2028-01-01",
        currentStatePension: 10000,
        statePensionApplyFutureGrowth: true,
        statePensionCpiPercent: 3,
        statePensionWageGrowthPercent: 4,
      })
    ).toBeCloseTo(10816, 6);
    expect(
      calculateAnnualStatePensionAtDraw({
        ...defaultSettings,
        startDate: "2026-01-01",
        statePensionDrawDate: "2028-01-01",
        currentStatePension: 10000,
        statePensionApplyFutureGrowth: false,
        statePensionCpiPercent: 10,
        statePensionWageGrowthPercent: 10,
      })
    ).toBe(10000);
  });

  it("removes inflation from State Pension increases in real terms", () => {
    expect(
      calculateAnnualStatePensionAtDraw({
        ...defaultSettings,
        projectionBasis: "real",
        inflationRateAnnual: 2.5,
        startDate: "2026-01-01",
        statePensionDrawDate: "2028-01-01",
        currentStatePension: 10000,
        statePensionApplyFutureGrowth: true,
        statePensionWageGrowthPercent: 0,
      })
    ).toBeCloseTo(10000, 6);
  });

  it("adds the new State Pension deferral uplift from the selected draw date", () => {
    expect(
      calculateStatePensionDeferralIncreasePercent("1987-06-15", "2055-08-17")
    ).toBeCloseTo(1, 6);
    expect(
      calculateStatePensionDeferralIncreasePercent("1987-06-15", "2056-06-14")
    ).toBeCloseTo(52 / 9, 6);
    expect(
      calculateAnnualStatePensionAtDraw({
        ...defaultSettings,
        dateOfBirth: "1987-06-15",
        statePensionDrawDate: "2056-06-14",
        currentStatePension: 12000,
        statePensionApplyFutureGrowth: false,
      })
    ).toBeCloseTo(12693.333333, 6);
  });

  it("continues to uprate State Pension after draw while deferred extra grows by CPI", () => {
    const settings = {
      ...defaultSettings,
      projectionBasis: "nominal" as const,
      startDate: "2026-01-01",
      dateOfBirth: "1987-06-15",
      statePensionDrawDate: "2056-06-14",
      currentStatePension: 10000,
      statePensionApplyFutureGrowth: true,
      statePensionCpiPercent: 3,
      statePensionWageGrowthPercent: 4,
    };

    const baseAtDraw = 10000 * 1.04 ** 30;
    const deferredExtraAtDraw = baseAtDraw * (52 / 9 / 100);
    const baseAtRow = 10000 * 1.04 ** 32;
    const deferredExtraAtRow = deferredExtraAtDraw * 1.025 ** 2;

    expect(
      calculateAnnualStatePensionAtDate(settings, "2058-06-14")
    ).toBeCloseTo(baseAtRow + deferredExtraAtRow, 6);
  });
});
