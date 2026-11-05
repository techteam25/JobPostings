import {
  getEmployerAllowedTransitions,
  getApplicationStatusLabel,
} from "../application-status";

describe("getEmployerAllowedTransitions", () => {
  it("returns only forward employer transitions, excluding withdrawn", () => {
    expect(getEmployerAllowedTransitions("pending")).toEqual(["reviewed"]);
    expect(getEmployerAllowedTransitions("reviewed")).toEqual([
      "shortlisted",
      "rejected",
    ]);
    expect(getEmployerAllowedTransitions("shortlisted")).toEqual([
      "interviewing",
      "rejected",
    ]);
    expect(getEmployerAllowedTransitions("interviewing")).toEqual([
      "hired",
      "rejected",
    ]);
  });

  it("returns no transitions for terminal statuses", () => {
    expect(getEmployerAllowedTransitions("rejected")).toEqual([]);
    expect(getEmployerAllowedTransitions("hired")).toEqual([]);
    expect(getEmployerAllowedTransitions("withdrawn")).toEqual([]);
  });
});

describe("getApplicationStatusLabel", () => {
  it("returns human-readable labels", () => {
    expect(getApplicationStatusLabel("reviewed")).toBe("Under Review");
    expect(getApplicationStatusLabel("hired")).toBe("Offer Extended / Hired");
  });
});
