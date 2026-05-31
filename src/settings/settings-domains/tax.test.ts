import { coerceTaxSettings, normalizeTaxationBooleanSetting } from "./tax";
import type { StoredPensionSettings } from "../settings-types";

describe("tax domain", () => {
  it("normalizes taxation flag", () => {
    expect(normalizeTaxationBooleanSetting(0)).toBe(false);
    expect(normalizeTaxationBooleanSetting("enabled")).toBe(true);
  });

  it("coerces stored values", () => {
    const storedSettings = {
      taxationEnabled: true,
      taxPersonalAllowance: "12570",
      taxPersonalAllowanceTaperThreshold: "100000",
      taxBasicRateLimit: "37700",
      taxAdditionalRateThreshold: "125140",
      taxBasicRatePercent: "20",
      taxHigherRatePercent: "40",
      taxAdditionalRatePercent: "45",
      taxSippTaxFreeWithdrawalPercent: "25",
    } as unknown as Partial<StoredPensionSettings>;

    expect(coerceTaxSettings(storedSettings)).toEqual({
      taxationEnabled: true,
      taxPersonalAllowance: 12570,
      taxPersonalAllowanceTaperThreshold: 100000,
      taxBasicRateLimit: 37700,
      taxAdditionalRateThreshold: 125140,
      taxBasicRatePercent: 20,
      taxHigherRatePercent: 40,
      taxAdditionalRatePercent: 45,
      taxSippTaxFreeWithdrawalPercent: 25,
    });
  });
});
