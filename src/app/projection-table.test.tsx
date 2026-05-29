import { act, fireEvent, render, screen } from "@testing-library/react";
import { ProjectionTableSection } from "./projection-table";
import { createDefaultSettings } from "../settings";
import type { ProjectionRow } from "../projection";

const rows: ProjectionRow[] = [
  {
    date: "2026-01-01",
    age: 40,
    ageMonths: 0,
    milestones: ["Start"],
    milestoneDates: ["2026-01-01"],
    monthlyAddedPension: 0,
    lumpSumAddedPension: 0,
    annualStandardAlphaPension: 1000,
    annualEpaAlphaPension: 0,
    annualAccruedAlphaPension: 1000,
    annualAlphaPensionIncludingReduction: 1000,
    monthlyAlphaPensionTakeHome: 80,
    annualNuvosPension: 0,
    annualNuvosPensionIncludingReduction: 0,
    monthlyNuvosPensionTakeHome: 0,
    monthlyStatePension: 0,
    sippPot: 0,
    monthlySippPension: 0,
    isaPot: 0,
    monthlyIsaPension: 0,
    totalMonthlyPensionIncomeBeforeTax: 80,
    monthlyIncomeTax: 0,
    totalMonthlyPensionTakeHomePay: 80,
  },
];

describe("projection-table module", () => {
  it("defers table rendering then displays controls", () => {
    vi.useFakeTimers();

    render(<ProjectionTableSection rows={rows} settings={createDefaultSettings()} />);

    expect(screen.getByText("Preparing projection table...")).toBeInTheDocument();

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByRole("button", { name: "Show all rows" })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("toggles milestone filter", () => {
    vi.useFakeTimers();
    render(<ProjectionTableSection rows={rows} settings={createDefaultSettings()} />);

    act(() => {
      vi.runAllTimers();
    });

    const button = screen.getByRole("button", { name: "Show all rows" });
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Only show milestone rows" })).toBeInTheDocument();
    vi.useRealTimers();
  });
});
