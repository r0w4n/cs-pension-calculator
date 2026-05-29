import { describe, expect, it } from "vitest";
import {
  calculateRealAnnualRate,
  calculateRetirementIncomeTargetAtDate,
} from "./inflation";
import { defaultSettings, type PensionSettings } from "../settings";

describe("projection inflation domain", () => {
  it("converts nominal returns to real annual rates", () => {
    expect(calculateRealAnnualRate(0.07, 0.025)).toBeCloseTo(0.043902439, 9);
  });

  it("inflates retirement targets only in nominal terms", () => {
    const settings: PensionSettings = {
      ...defaultSettings,
      projectionBasis: "nominal",
      inflationRateAnnual: 2.5,
      desiredRetirementIncome: 31700,
      startDate: "2026-01-01",
    };

    expect(calculateRetirementIncomeTargetAtDate(settings, "2028-01-01")).toBeCloseTo(
      31700 * 1.025 ** 2,
      6,
    );
    expect(
      calculateRetirementIncomeTargetAtDate(
        {
          ...settings,
          projectionBasis: "real",
        },
        "2028-01-01",
      ),
    ).toBe(31700);
  });
});
