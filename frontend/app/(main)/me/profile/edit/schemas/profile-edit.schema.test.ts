import { describe, expect, it } from "vitest";

import { profileEditSchema, stripHtmlTags } from "./profile-edit.schema";

const base = {
  fullName: "Christy Young",
  country: "Nigeria",
  bio: "",
};

describe("profile edit payload", () => {
  it("saves a phone-only edit with an empty rich-text paragraph", () => {
    const result = profileEditSchema.safeParse({
      ...base,
      bio: "<p></p>",
      phoneNumber: "0801 234 5678",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBe("");
      expect(result.data.phoneNumber).toBe("+2348012345678");
    }
  });

  it("counts decoded visible text", () => {
    expect(stripHtmlTags("<p>Tom &amp; Jane</p><p>Next</p>")).toBe(
      "Tom & Jane Next",
    );
    expect(
      profileEditSchema.safeParse({
        ...base,
        bio: `<p>${"a".repeat(999)}&amp;</p>`,
      }).success,
    ).toBe(true);
  });

  it("points to an invalid phone field", () => {
    const result = profileEditSchema.safeParse({
      ...base,
      phoneNumber: "12",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["phoneNumber"]);
    }
  });
});
