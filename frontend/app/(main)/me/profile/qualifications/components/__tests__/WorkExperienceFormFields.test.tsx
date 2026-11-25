import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnyFieldApi } from "@tanstack/react-form";

import { WorkExperienceFormFields } from "../WorkExperienceFormFields";

vi.mock("@/components/common/DynamicRichTextEditor", () => ({
  DynamicRichTextEditor: () => <div />,
}));
vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: () => <div />,
}));

function field(name: string, value: unknown): AnyFieldApi {
  return {
    name,
    state: { value, meta: { errors: [] } },
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
  } as unknown as AnyFieldApi;
}

function renderFields(companyName: string) {
  const companyNameField = field("companyName", companyName);
  render(
    <WorkExperienceFormFields
      companyNameField={companyNameField}
      jobTitleField={field("jobTitle", "")}
      descriptionField={field("description", "")}
      startDateField={field("startDate", "")}
      endDateField={field("endDate", "")}
      currentField={field("current", false)}
    />,
  );
  return companyNameField;
}

describe("work experience kind controls", () => {
  it("allows a new self-employed entry without a company name", async () => {
    const companyNameField = renderFields("");

    await userEvent
      .setup()
      .click(screen.getByRole("radio", { name: "Self-employed" }));

    expect(companyNameField.handleChange).toHaveBeenCalledWith("Self-employed");
  });

  it("recognizes an edited independent contractor entry", () => {
    renderFields("Independent contractor");

    expect(
      screen.getByRole("radio", { name: "Independent contractor" }),
    ).toBeChecked();
    expect(
      screen.queryByRole("textbox", { name: /organization or client name/i }),
    ).toBeNull();
  });
});
