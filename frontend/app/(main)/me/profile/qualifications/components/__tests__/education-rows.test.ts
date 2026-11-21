import { z } from "zod";

import {
  educationFormSchema,
  type EducationFormData,
} from "@/schemas/educations";
import { getEducationRowsToSave } from "../education-rows";

const blank: EducationFormData = {
  schoolName: "",
  program: "Bachelors",
  major: "",
  graduated: false,
  startDate: "",
  endDate: undefined,
};

const completed: EducationFormData = {
  ...blank,
  schoolName: "Community College",
  major: "Nursing",
  startDate: "2020-01-01T00:00:00.000Z",
};

describe("education rows submitted from the add dialog", () => {
  it("saves a completed school when an unused second row remains", () => {
    const submitted = getEducationRowsToSave([completed, blank]);
    const result = z.array(educationFormSchema).safeParse(submitted);

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual([completed]);
  });

  it("keeps a partially entered second row so validation blocks save", () => {
    const submitted = getEducationRowsToSave([
      completed,
      { ...blank, schoolName: "Another school" },
    ]);

    expect(submitted).toHaveLength(2);
    expect(z.array(educationFormSchema).safeParse(submitted).success).toBe(
      false,
    );
  });

  it("does not silently discard an empty first row", () => {
    const submitted = getEducationRowsToSave([blank, blank]);

    expect(submitted).toHaveLength(1);
    expect(z.array(educationFormSchema).safeParse(submitted).success).toBe(
      false,
    );
  });
});
