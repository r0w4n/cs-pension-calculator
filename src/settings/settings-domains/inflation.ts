import type { PensionSettings, ProjectionBasis } from "../settings-types";

export const inflationDefaults = {
  projectionBasis: "real" as ProjectionBasis,
  inflationRateAnnual: 2.5,
} as const;

export const inflationNumericSettingRules = {
  inflationRateAnnual: { min: 0, max: 10, step: 0.1 },
} as const;

export function normalizeProjectionBasis(value: unknown): ProjectionBasis {
  return value === "nominal" || value === "real"
    ? value
    : inflationDefaults.projectionBasis;
}

export function normalizeInflationSetting<
  K extends "projectionBasis" | "inflationRateAnnual",
>(
  key: K,
  value: PensionSettings[K],
  normalizeNumeric: (key: "inflationRateAnnual", value: unknown) => number
) {
  if (key === "projectionBasis") {
    return normalizeProjectionBasis(value) as PensionSettings[K];
  }

  return normalizeNumeric("inflationRateAnnual", value) as PensionSettings[K];
}
