import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { GuidanceNotesToggle, JourneySection } from "./journey";

describe("journey module", () => {
  it("renders journey section wrapper", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <JourneySection activeModeRef={ref}>
        <p>Body</p>
      </JourneySection>,
    );

    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("emits guidance toggle updates", () => {
    const onChange = vi.fn();

    render(<GuidanceNotesToggle checked onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
