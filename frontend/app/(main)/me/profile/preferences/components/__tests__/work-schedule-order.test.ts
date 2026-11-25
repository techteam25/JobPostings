import { orderWorkScheduleDays } from "../work-schedule-order";

describe("work schedule weekday order", () => {
  it("orders days chosen out of sequence before saving", () => {
    expect(orderWorkScheduleDays(["friday", "monday", "wednesday"])).toEqual([
      "monday",
      "wednesday",
      "friday",
    ]);
  });

  it("orders older saved arrays for display without changing the selection", () => {
    const saved = ["thursday", "tuesday", "monday"];

    expect(orderWorkScheduleDays(saved)).toEqual([
      "monday",
      "tuesday",
      "thursday",
    ]);
    expect(saved).toEqual(["thursday", "tuesday", "monday"]);
  });
});
