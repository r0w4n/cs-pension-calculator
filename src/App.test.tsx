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
    expect(screen.getByLabelText("Planned SIPP Draw Age")).toHaveAttribute("type", "range");
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
    expect(screen.getByLabelText("Target Total Pension Income (£ per year)")).toHaveValue(
      defaultSettings.targetPension.toString(),
    );
    expect(screen.getByLabelText("Alpha Annual Benefit Statement Date")).toHaveValue(
      defaultSettings.alphaPensionAbsDate,
    );
  });

  it("updates every setting and saves to local storage", async () => {
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

    fireEvent.change(screen.getByLabelText("Your Normal Pension Age"), {
      target: { value: "67" },
    });
    fireEvent.change(screen.getByLabelText("Planned Early Retirement Age"), {
      target: { value: "58" },
    });
    fireEvent.change(screen.getByLabelText("Planned SIPP Draw Age"), {
      target: { value: "61" },
    });
    fireEvent.change(screen.getByLabelText("Age You Leave Alpha Pensionable Service"), {
      target: { value: "62" },
    });
    fireEvent.change(screen.getByLabelText("Planned Alpha Pension Draw Age"), {
      target: { value: "63" },
    });

    fireEvent.change(screen.getByLabelText("Assumed Life Expectancy (Age)"), {
      target: { value: "92" },
    });
    fireEvent.change(screen.getByLabelText("Target Total Pension Income (£ per year)"), {
      target: { value: "45000" },
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

    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}")).toEqual({
      dateOfBirth: "1990-02-14",
      lifeExpectancy: 92,
      normalPensionAge: 67,
      earlyRetirementAge: 58,
      targetPension: 45000,
      currentStatePension: 11800,
      statePensionDrawDate: "2058-02-14",
      sippPensionDrawAge: 61,
      alphaPensionAbsDate: "2026-03-31",
      alphaAddedPensionMonthly: 225,
      alphaPensionLeaveAge: 62,
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
        targetPension: 52000,
        normalPensionAge: 69,
      }),
    );

    render(<App />);

    expect(screen.getByLabelText("Calculation Start Date")).toHaveValue(getTodayIsoDate());
    expect(screen.getByLabelText("Target Total Pension Income (£ per year)")).toHaveValue("52000");
    expect(screen.getByLabelText("Your Normal Pension Age")).toHaveValue("69");
    expect(screen.getByText("£52,000 a year")).toBeInTheDocument();
  });

  it("normalizes unexpected stored values back to allowed settings", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...defaultSettings,
        lifeExpectancy: 120,
        normalPensionAge: 120,
        earlyRetirementAge: 40,
        targetPension: 45123,
        currentStatePension: -10,
        sippPensionDrawAge: 999,
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
    expect(screen.getByLabelText("Target Total Pension Income (£ per year)")).toHaveValue(
      "45000",
    );
    expect(screen.getByLabelText("Current Full State Pension (£ per year)")).toHaveValue("0");
    expect(screen.getByLabelText("Planned SIPP Draw Age")).toHaveValue("85");
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
