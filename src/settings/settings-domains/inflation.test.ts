import { normalizeInflationSetting, normalizeProjectionBasis } from "./inflation";

describe("inflation settings module", () => {
  it("normalizes projection basis values", () => {
    expect(normalizeProjectionBasis("nominal")).toBe("nominal");
    expect(normalizeProjectionBasis("bad")).toBe("real");
  });

  it("normalizes inflation fields", () => {
    const normalizeNumeric = vi.fn(() => 2.5);

    expect(normalizeInflationSetting("projectionBasis", "real", normalizeNumeric)).toBe(
      "real",
    );
    expect(normalizeInflationSetting("inflationRateAnnual", 99, normalizeNumeric)).toBe(
      2.5,
    );
    expect(normalizeNumeric).toHaveBeenCalledWith("inflationRateAnnual", 99);
  });
});
