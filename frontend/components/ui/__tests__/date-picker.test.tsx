import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DatePicker } from "../date-picker";

describe("date picker inside a scrolling dialog", () => {
  it("keeps its calendar in the dialog outside the scroll viewport and selects day 31", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { getByTestId } = render(
      <div role="dialog" data-testid="parent-dialog">
        <div data-testid="scroll-viewport">
          <DatePicker value={undefined} onChange={onChange} />
        </div>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Pick a date" }));

    const dialog = getByTestId("parent-dialog");
    const viewport = getByTestId("scroll-viewport");
    expect(dialog.querySelector('[data-slot="calendar"]')).not.toBeNull();
    expect(viewport.querySelector('[data-slot="calendar"]')).toBeNull();

    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "Choose the Month" }),
      "0",
    );
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "Choose the Year" }),
      "2025",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Go to the Next Month" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Go to the Previous Month" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: /January 31st, 2025/i }),
    );

    expect(onChange).toHaveBeenCalledWith(new Date(2025, 0, 31));
  });
});
