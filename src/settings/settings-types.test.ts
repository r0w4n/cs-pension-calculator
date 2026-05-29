import {
  FIRST_UNSUPPORTED_ADDED_PENSION_PURCHASE_AGE,
  MAX_ADDED_PENSION_PURCHASE_INPUT_AGE,
  NORMAL_MINIMUM_PENSION_AGE_INCREASE_DATE,
  SETTINGS_STORAGE_KEY,
  STATE_PENSION_AGE_STEP,
} from "./settings-types";

describe("settings-types", () => {
  it("exposes stable constants", () => {
    expect(SETTINGS_STORAGE_KEY).toBe("cs-pension-modeller.settings");
    expect(FIRST_UNSUPPORTED_ADDED_PENSION_PURCHASE_AGE).toBe(68);
    expect(MAX_ADDED_PENSION_PURCHASE_INPUT_AGE).toBe(67.9);
    expect(NORMAL_MINIMUM_PENSION_AGE_INCREASE_DATE).toBe("2028-04-06");
    expect(STATE_PENSION_AGE_STEP).toBe(0.25);
  });
});
