import { fireEvent, render, screen } from "@testing-library/react";
import { DateInputFieldEditor } from "./form-fields";

describe("form-fields module", () => {
  it("commits date editor changes on blur", () => {
    const onCommit = vi.fn((value: string) => value);

    render(
      <DateInputFieldEditor
        label="Start"
        initialValue="2026-01-01"
        onCommit={onCommit}
      />
    );

    const input = screen.getByLabelText("Start");
    fireEvent.change(input, { target: { value: "2026-02-01" } });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledWith("2026-02-01");
  });
});
