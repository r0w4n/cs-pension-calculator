import { describe, expect, it } from "vitest";
import {
  calculateAnnualNuvosPensionAtDate,
  calculateNuvosPensionRevaluationFactor,
} from "./nuvos";
import { defaultSettings, type PensionSettings } from "../settings";

describe("projection nuvos domain", () => {
  it("calculates nuvos accrual at 2.3 percent of pensionable earnings", () => {
    const settings: PensionSettings = {
      ...defaultSettings,
      showNuvos: true,
      startDate: "2025-04-01",
      dateOfBirth: "1960-04-01",
      lifeExpectancy: 90,
      nuvosPensionAbsDate: "2025",
      nuvosAccruedPensionAtLastAbs: 1000,
      nuvosPensionableEarnings: 12000,
      nuvosPensionLeaveAge: 65,
      nuvosPensionDrawAge: 65,
    };

    expect(
      calculateAnnualNuvosPensionAtDate({
        settings,
        rowDate: "2026-04-01",
        nuvosAbsDate: "2025-04-01",
        accrualStopDate: "2026-04-01",
      })
    ).toBeCloseTo(1276, 6);
  });

  it("applies nuvos CPI revaluation without the Alpha active-service uplift", () => {
    expect(
      calculateNuvosPensionRevaluationFactor({
        fromDate: "2025-04-01",
        rowDate: "2027-04-01",
        cpiPercent: 2,
      })
    ).toBeCloseTo(1.0404, 6);
  });
});
