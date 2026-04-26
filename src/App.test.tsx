import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import {
  SETTINGS_STORAGE_KEY,
  defaultSettings,
  getTodayIsoDate,
} from "./settings";

describe("App settings form", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders sensible default values", () => {
    render(<App />);

    expect(screen.getByLabelText("Calculation Start Date")).toHaveValue(getTodayIsoDate());
    expect(screen.getByLabelText("Your Date of Birth")).toHaveValue(defaultSettings.dateOfBirth);
    expect(screen.getByLabelText("Your Normal Pension Age")).toHaveAttribute("type", "range");
    expect(screen.getByLabelText("Planned Early Retirement Age")).toHaveAttribute(
      "type",
      "range",
    );
    expect(screen.getByLabelText("Age You Leave Alpha Pensionable Service")).toHaveAttribute(
      "type",
      "range",
    );
    expect(screen.getByLabelText("Planned Alpha Pension Draw Age")).toHaveAttribute(
      "type",
      "range",
    );
    expect(screen.getByLabelText("Assumed Life Expectancy (Age)")).toHaveValue(
      defaultSettings.lifeExpectancy.toString(),
    );
    expect(screen.getByLabelText("Your Normal Pension Age")).toHaveValue(
      defaultSettings.normalPensionAge.toString(),
    );
    expect(screen.getByLabelText("Alpha Annual Benefit Statement Date")).toHaveValue(
      defaultSettings.alphaPensionAbsDate,
    );
    expect(
      screen.getByRole("heading", { name: "Monthly pension projection table" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", {
        name: "Total Monthly Pension Take home pay",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", {
        name: "Annual Alpha Pension Including Reduction",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Pension Summary" })).toHaveLength(2);
    expect(screen.getByText("Monthly Alpha Pension at retirement")).toBeInTheDocument();
    expect(screen.getByText("Total Monthly Pension at State Pension start")).toBeInTheDocument();
    expect(screen.getAllByText("Starts Alpha pension").length).toBeGreaterThan(0);
  });

  it("updates settings and saves to local storage", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Calculation Start Date"), {
      target: { value: "2020-04-01" },
    });
    fireEvent.change(screen.getByLabelText("Your Date of Birth"), {
      target: { value: "1990-02-14" },
    });
    fireEvent.change(screen.getByLabelText("State Pension Start Date"), {
      target: { value: "2058-02-14" },
    });
    fireEvent.change(screen.getByLabelText("Alpha Annual Benefit Statement Date"), {
      target: { value: "2026-03-31" },
    });
    fireEvent.change(screen.getByLabelText("Current Full State Pension (£ per year)"), {
      target: { value: "11800" },
    });
    fireEvent.change(screen.getByLabelText("Added Alpha Pension (£ per month)"), {
      target: { value: "225" },
    });
    fireEvent.change(
      screen.getByLabelText("Alpha Pension Accrued at Last Statement (£ per year)"),
      {
        target: { value: "12500" },
      },
    );
    fireEvent.change(
      screen.getByLabelText("Current Pensionable Earnings (£ per year)"),
      {
        target: { value: "56000" },
      },
    );
    fireEvent.change(screen.getByLabelText("Planned Alpha Pension Draw Age"), {
      target: { value: "63" },
    });

    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}")).toEqual({
      dateOfBirth: "1990-02-14",
      lifeExpectancy: defaultSettings.lifeExpectancy,
      normalPensionAge: defaultSettings.normalPensionAge,
      earlyRetirementAge: defaultSettings.earlyRetirementAge,
      currentStatePension: 11800,
      statePensionDrawDate: "2058-02-14",
      alphaPensionAbsDate: "2026-03-31",
      alphaAddedPensionMonthly: 225,
      alphaPensionLeaveAge: defaultSettings.alphaPensionLeaveAge,
      accruedPensionAtLastAbs: 12500,
      pensionableEarnings: 56000,
      alphaPensionDrawAge: 63,
    });
  });

  it("loads settings from local storage on first render", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...defaultSettings,
        startDate: "1999-01-01",
        normalPensionAge: 69,
      }),
    );

    render(<App />);

    expect(screen.getByLabelText("Calculation Start Date")).toHaveValue(getTodayIsoDate());
    expect(screen.getByLabelText("Your Normal Pension Age")).toHaveValue("69");
    expect(screen.getAllByText(/At State Pension start/i).length).toBeGreaterThan(0);
  });

  it("normalizes unexpected stored values back to allowed settings", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...defaultSettings,
        lifeExpectancy: 120,
        normalPensionAge: 120,
        earlyRetirementAge: 40,
        currentStatePension: -10,
        alphaAddedPensionMonthly: 233,
        alphaPensionLeaveAge: 10,
        accruedPensionAtLastAbs: 12444,
        pensionableEarnings: 56321,
        alphaPensionDrawAge: 200,
      }),
    );

    render(<App />);

    expect(screen.getByLabelText("Assumed Life Expectancy (Age)")).toHaveValue("100");
    expect(screen.getByLabelText("Your Normal Pension Age")).toHaveValue("70");
    expect(screen.getByLabelText("Planned Early Retirement Age")).toHaveValue("55");
    expect(screen.getByLabelText("Current Full State Pension (£ per year)")).toHaveValue("0");
    expect(screen.getByLabelText("Added Alpha Pension (£ per month)")).toHaveValue("225");
    expect(screen.getByLabelText("Age You Leave Alpha Pensionable Service")).toHaveValue("55");
    expect(
      screen.getByLabelText("Alpha Pension Accrued at Last Statement (£ per year)"),
    ).toHaveValue("12500");
    expect(screen.getByLabelText("Current Pensionable Earnings (£ per year)")).toHaveValue(
      "56500",
    );
    expect(screen.getByLabelText("Planned Alpha Pension Draw Age")).toHaveValue("85");
  });
});
