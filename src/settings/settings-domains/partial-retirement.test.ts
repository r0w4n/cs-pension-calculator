import { createDefaultSettings } from "../settings-defaults";
import {
  getPartialRetirementContributionMultiplier,
  getPartialRetirementSavingsContributionMultiplier,
  getPartialRetirementStartDate,
  validatePartialRetirementRules,
} from "./partial-retirement";

describe("partial-retirement settings module", () => {
  it("computes partial retirement start date", () => {
    const settings = createDefaultSettings();
    expect(getPartialRetirementStartDate(settings)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("calculates contribution multipliers", () => {
    const settings = {
      ...createDefaultSettings(),
      partialRetirementEnabled: true,
      partialRetirementWorkPercent: 50,
      fullSalary: 100,
    };
    const startDate = getPartialRetirementStartDate(settings);

    expect(getPartialRetirementContributionMultiplier(settings, startDate)).toBe(0.5);
    expect(getPartialRetirementSavingsContributionMultiplier(settings, startDate)).toBe(0.5);
  });

  it("validates partial retirement window", () => {
    const settings = {
      ...createDefaultSettings(),
      partialRetirementEnabled: true,
    };

    const issues = validatePartialRetirementRules({
      settings,
      lifeExpectancyDate: settings.dateOfBirth,
      retirementDate: settings.dateOfBirth,
      partialRetirementStartDate: settings.dateOfBirth,
    });

    expect(issues.length).toBeGreaterThan(0);
  });
});
