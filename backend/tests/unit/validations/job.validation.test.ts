import { describe, expect, it } from "vitest";

import { createJobSchema } from "@/validations/job.validation";

/** Payload the employer create-job form POSTs today (see frontend CreateJobInput). */
const frontendCreateJobPayload = {
  title: "Communications Coordinator",
  description:
    "ability to ensure information is organized; strong written and oral communication skills.",
  city: "Longview",
  state: "TX",
  country: "United States",
  zipcode: 75602,
  jobType: "full-time" as const,
  compensationType: "missionary" as const,
  isRemote: false,
  applicationDeadline: "2030-12-09",
  experience: "4",
  employerId: 1,
};

function parseBody(body: Record<string, unknown>) {
  return createJobSchema.safeParse({
    body,
    params: {},
    query: {},
  });
}

describe("createJobSchema — employer create-job form payload", () => {
  it("accepts the payload the create-job form actually submits", () => {
    const result = parseBody(frontendCreateJobPayload);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.body.zipcode).toBe("75602");
    expect(result.data.body.applicationDeadline).toBe("2030-12-09T00:00:00.000Z");
    expect(result.data.body.skills).toEqual([]);
  });

  it("coerces a numeric zipcode to a string", () => {
    const result = parseBody({
      ...frontendCreateJobPayload,
      zipcode: 75602,
      applicationDeadline: "2030-12-09T00:00:00.000Z",
      skills: ["communication"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.zipcode).toBe("75602");
    }
  });

  it("accepts a date-only application deadline", () => {
    const result = parseBody({
      ...frontendCreateJobPayload,
      zipcode: "75602",
      applicationDeadline: "2030-12-09",
      skills: ["communication"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.applicationDeadline).toBe(
        "2030-12-09T00:00:00.000Z",
      );
    }
  });

  it("accepts a job with no skills (form does not collect them)", () => {
    const { skills: _skills, ...withoutSkills } = {
      ...frontendCreateJobPayload,
      zipcode: "75602",
      applicationDeadline: "2030-12-09T00:00:00.000Z",
    };

    const result = parseBody(withoutSkills);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.skills).toEqual([]);
    }
  });

  it("accepts a null application deadline (optional in the UI)", () => {
    const result = parseBody({
      ...frontendCreateJobPayload,
      zipcode: "75602",
      applicationDeadline: null,
      skills: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.applicationDeadline).toBeNull();
    }
  });
});
