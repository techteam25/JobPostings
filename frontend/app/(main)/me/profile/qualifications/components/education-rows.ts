import type { EducationFormData } from "@/schemas/educations";

const DEFAULT_PROGRAM = "Bachelors";

function isBlankEducationRow(row: EducationFormData): boolean {
  return (
    row.schoolName.trim() === "" &&
    row.program === DEFAULT_PROGRAM &&
    row.major.trim() === "" &&
    row.startDate === "" &&
    !row.endDate &&
    !row.graduated
  );
}

/** Keep the first row so an empty form still reports its required fields. */
export function getEducationRowsToSave(
  rows: EducationFormData[],
): EducationFormData[] {
  return rows.filter((row, index) => index === 0 || !isBlankEducationRow(row));
}
