import { fireEvent, render, screen } from "@testing-library/react";
import { ComparisonBuilder, ComparisonSection } from "./comparison";

describe("comparison module", () => {
  it("renders comparison section children", () => {
    render(
      <ComparisonSection>
        <p>Comparison child</p>
      </ComparisonSection>
    );

    expect(screen.getByText("Comparison child")).toBeInTheDocument();
  });

  it("supports adding a scenario", () => {
    const setScenarioNameDraft = vi.fn();
    const addCurrentScenario = vi.fn();

    render(
      <ComparisonBuilder
        scenarioCount={1}
        actions={{
          currentScenarioIsValid: true,
          comparisonLimitReached: false,
          scenarioNameDraft: "",
          setScenarioNameDraft,
          addCurrentScenario,
        }}
      />
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Scenario name" }), {
      target: { value: "My scenario" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to comparison" }));

    expect(setScenarioNameDraft).toHaveBeenCalledWith("My scenario");
    expect(addCurrentScenario).toHaveBeenCalled();
  });
});
