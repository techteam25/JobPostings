import { statusRegressionGuard } from "@/utils/update-status-guard";

describe("statusRegressionGuard", () => {
  test("allows valid transitions and returns the attempted status", () => {
    expect(statusRegressionGuard("pending", "reviewed")).toBe("reviewed");
    expect(statusRegressionGuard("pending", "withdrawn")).toBe("withdrawn");
    expect(statusRegressionGuard("reviewed", "shortlisted")).toBe(
      "shortlisted",
    );
    expect(statusRegressionGuard("shortlisted", "interviewing")).toBe(
      "interviewing",
    );
    expect(statusRegressionGuard("interviewing", "hired")).toBe("hired");
  });

  test("throws ValidationError for invalid transitions", () => {
    expect(() => statusRegressionGuard("pending", "hired")).toThrow();
    expect(() => statusRegressionGuard("shortlisted", "reviewed")).toThrow();
  });

  test("throws ValidationError with descriptive message", () => {
    expect(() => statusRegressionGuard("hired", "pending")).toThrow(
      "Invalid status transition from hired to pending",
    );
  });

  test("disallows transitioning to the same status", () => {
    expect(() => statusRegressionGuard("pending", "pending")).toThrow();
  });

  test("rejects any update attempts for terminal states", () => {
    expect(() => statusRegressionGuard("rejected", "pending")).toThrow();
    expect(() => statusRegressionGuard("hired", "withdrawn")).toThrow();
    expect(() => statusRegressionGuard("withdrawn", "reviewed")).toThrow();
  });
});
