import { fireEvent, render, screen } from "@testing-library/react";
import { ModeSelection } from "./mode-selection";

describe("mode-selection", () => {
  it("calls onSelectMode when a card is clicked", () => {
    const onSelectMode = vi.fn();

    render(<ModeSelection selectedMode={null} onSelectMode={onSelectMode} />);

    fireEvent.click(screen.getByRole("button", { name: /Simple journey/i }));
    expect(onSelectMode).toHaveBeenCalledWith("simple");
  });
});
