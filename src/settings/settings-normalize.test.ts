import {
  normalizeSetting,
  normalizeSippDrawAge,
  normalizeStatePensionDrawDate,
} from "./settings-normalize";

describe("settings-normalize", () => {
  it("normalizes ranges and enum values", () => {
    expect(normalizeSetting("desiredRetirementIncome", 43899.6)).toBe(43900);
    expect(normalizeSetting("projectionBasis", "bad" as never)).toBe("real");
    expect(normalizeSetting("alphaAddedPensionFactorType", "bad" as never)).toBe(
      "self",
    );
  });

  it("normalizes date-based values", () => {
    expect(normalizeStatePensionDrawDate("bad-date", "1987-06-15")).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
    expect(normalizeSippDrawAge(55, "1987-06-15")).toBe(57);
  });
});
