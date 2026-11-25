import {
  getCompanyNameForKind,
  getEmploymentKind,
  INDEPENDENT_CONTRACTOR_LABEL,
  SELF_EMPLOYED_LABEL,
} from "../employment-kind";

describe("work experience without a single employer", () => {
  it("stores a visible nonempty label for self-employed and contract work", () => {
    expect(getCompanyNameForKind("self-employed")).toBe(SELF_EMPLOYED_LABEL);
    expect(getCompanyNameForKind("independent-contractor")).toBe(
      INDEPENDENT_CONTRACTOR_LABEL,
    );
  });

  it("recognizes saved labels when editing existing experience", () => {
    expect(getEmploymentKind(SELF_EMPLOYED_LABEL)).toBe("self-employed");
    expect(getEmploymentKind(INDEPENDENT_CONTRACTOR_LABEL)).toBe(
      "independent-contractor",
    );
    expect(getEmploymentKind("A real client")).toBe("organization");
  });
});
