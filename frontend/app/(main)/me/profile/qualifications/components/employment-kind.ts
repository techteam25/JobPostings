export type EmploymentKind =
  | "organization"
  | "self-employed"
  | "independent-contractor";

export const SELF_EMPLOYED_LABEL = "Self-employed";
export const INDEPENDENT_CONTRACTOR_LABEL = "Independent contractor";

export function getEmploymentKind(companyName: string): EmploymentKind {
  if (companyName === SELF_EMPLOYED_LABEL) return "self-employed";
  if (companyName === INDEPENDENT_CONTRACTOR_LABEL) {
    return "independent-contractor";
  }
  return "organization";
}

export function getCompanyNameForKind(kind: EmploymentKind): string {
  switch (kind) {
    case "self-employed":
      return SELF_EMPLOYED_LABEL;
    case "independent-contractor":
      return INDEPENDENT_CONTRACTOR_LABEL;
    default:
      return "";
  }
}
