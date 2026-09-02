import { applicationFormSchema, step3LocationSchema } from "../index";

describe("application form schemas barrel", () => {
  it("exports a usable location step schema from the public applications entry", () => {
    const parsed = step3LocationSchema.parse({
      country: "United States",
      city: "Dallas",
      state: "TX",
      zipcode: "75201",
    });

    expect(parsed.city).toBe("Dallas");
  });

  it("exports a composite application form schema", () => {
    expect(applicationFormSchema).toBeDefined();
    expect(applicationFormSchema.shape.country).toBeDefined();
  });
});
