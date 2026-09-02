import { createJobSchema } from "@/schemas/jobs";
import type { Job } from "@/schemas/responses/jobs";
import { mapJobToFormValues } from "../use-edit-job-form";

function apiJob(overrides: Record<string, unknown> = {}): Job {
  return {
    id: 1,
    title: "Web designer",
    description: "Design landing pages",
    city: "Bani Murr",
    state: "Florida",
    country: "Albania",
    zipcode: "64819",
    jobType: "volunteer",
    compensationType: "volunteer",
    isRemote: false,
    isActive: true,
    applicationDeadline: "2026-03-03T00:00:00.000Z",
    experience: "Mid Level",
    employerId: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as unknown as Job;
}

describe("edit job form values from API JSON", () => {
  it("accepts an API zipcode string so changing the deadline stays valid", () => {
    const values = {
      ...mapJobToFormValues(apiJob()),
      applicationDeadline: "2026-05-19",
    };

    const result = createJobSchema.safeParse(values);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.zipcode).toBe("64819");
      expect(result.data.applicationDeadline).toBe("2026-05-19");
    }
  });

  it("does not report Invalid input for zipcode 64819", () => {
    const result = createJobSchema.safeParse(mapJobToFormValues(apiJob()));

    expect(result.success).toBe(true);
    if (!result.success) {
      const zipError = result.error.issues.find((issue) =>
        issue.path.includes("zipcode"),
      );
      expect(zipError?.message).not.toBe("Invalid input");
    }
  });
});
