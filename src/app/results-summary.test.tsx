import { fireEvent, render, screen } from "@testing-library/react";
import {
  RetirementIncomeDisplayToggle,
  RetirementIncomeSummaryFooter,
  ResultsSummarySection,
} from "./results-summary";

describe("results-summary module", () => {
  it("renders section children", () => {
    render(
      <ResultsSummarySection>
        <p>Summary child</p>
      </ResultsSummarySection>,
    );

    expect(screen.getByText("Summary child")).toBeInTheDocument();
  });

  it("switches income display", () => {
    const onChange = vi.fn();

    render(<RetirementIncomeDisplayToggle value="monthly" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Annual" }));
    expect(onChange).toHaveBeenCalledWith("annual");
  });

  it("renders retirement income footer labels", () => {
    render(
      <RetirementIncomeSummaryFooter
        totalLabel="Annual total"
        totalValue="£10"
        targetLabel="Annual target"
        targetValue="£20"
      />,
    );

    expect(screen.getByText("Annual total")).toBeInTheDocument();
    expect(screen.getByText("Annual target")).toBeInTheDocument();
  });
});
