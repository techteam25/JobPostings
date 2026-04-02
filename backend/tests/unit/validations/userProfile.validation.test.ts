import { describe, it, expect } from "vitest";
import {
  updateUserProfileSchema,
  stripHtmlTags,
} from "@/validations/userProfile.validation";

describe("updateUserProfileSchema", () => {
  const validBase = {
    educations: [],
    workExperiences: [],
    certifications: [],
  };

  // ─── Phone Validation ────────────────────────────────────────────────

  describe("phoneNumber validation", () => {
    const validPhoneFormats = [
      "1234567890",
      "(123) 456 7890",
      "123-456-7890",
      "+1 (123) 4567890",
      "+1 (123) 456 7890",
      "+11234567890",
    ];

    it.each(validPhoneFormats)(
      "should accept valid phone format: %s",
      (phone) => {
        const result = updateUserProfileSchema.safeParse({
          ...validBase,
          phoneNumber: phone,
        });
        expect(result.success).toBe(true);
      },
    );

    const invalidPhoneFormats = ["abc", "00", "12345"];

    it.each(invalidPhoneFormats)(
      "should reject invalid phone format: %s",
      (phone) => {
        const result = updateUserProfileSchema.safeParse({
          ...validBase,
          phoneNumber: phone,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const phoneError = result.error.issues.find(
            (i) => i.path[0] === "phoneNumber",
          );
          expect(phoneError).toBeDefined();
          expect(phoneError!.message).toBe("Invalid phone number");
        }
      },
    );

    it("should accept omitted phoneNumber (optional)", () => {
      const result = updateUserProfileSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });
  });

  // ─── Bio HTML-Stripping Validation ───────────────────────────────────

  describe("bio HTML-stripping validation", () => {
    it("should pass when plain text from HTML >= 10 characters", () => {
      const result = updateUserProfileSchema.safeParse({
        ...validBase,
        bio: "<p>Hello World</p>", // 11 chars plain
      });
      expect(result.success).toBe(true);
    });

    it("should fail when plain text from HTML < 10 characters", () => {
      const result = updateUserProfileSchema.safeParse({
        ...validBase,
        bio: "<p>Short</p>", // 5 chars plain
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const bioError = result.error.issues.find((i) => i.path[0] === "bio");
        expect(bioError).toBeDefined();
        expect(bioError!.message).toBe("Bio must be at least 10 characters");
      }
    });

    it("should not count HTML tags toward character length", () => {
      const result = updateUserProfileSchema.safeParse({
        ...validBase,
        bio: "<p><strong>Bold</strong> text</p>", // "Bold text" = 9 chars
      });
      expect(result.success).toBe(false);
    });

    it("should pass when plain text is exactly 1000 characters", () => {
      const text = "a".repeat(1000);
      const result = updateUserProfileSchema.safeParse({
        ...validBase,
        bio: `<p>${text}</p>`,
      });
      expect(result.success).toBe(true);
    });

    it("should fail when plain text exceeds 1000 characters", () => {
      const text = "a".repeat(1001);
      const result = updateUserProfileSchema.safeParse({
        ...validBase,
        bio: `<p>${text}</p>`,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const bioError = result.error.issues.find((i) => i.path[0] === "bio");
        expect(bioError).toBeDefined();
        expect(bioError!.message).toBe("Bio must not exceed 1000 characters");
      }
    });

    it("should accept omitted bio (optional)", () => {
      const result = updateUserProfileSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });
  });

  // ─── fullName Validation ─────────────────────────────────────────────

  describe("fullName validation", () => {
    it("should accept a valid fullName", () => {
      const result = updateUserProfileSchema.safeParse({
        ...validBase,
        fullName: "John Doe",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty fullName when provided", () => {
      const result = updateUserProfileSchema.safeParse({
        ...validBase,
        fullName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should accept omitted fullName (optional)", () => {
      const result = updateUserProfileSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });

    it("should reject fullName exceeding 100 characters", () => {
      const result = updateUserProfileSchema.safeParse({
        ...validBase,
        fullName: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── stripHtmlTags helper ────────────────────────────────────────────

  describe("stripHtmlTags", () => {
    it("should strip simple HTML tags", () => {
      expect(stripHtmlTags("<p>Hello</p>")).toBe("Hello");
    });

    it("should strip nested HTML tags", () => {
      expect(stripHtmlTags("<p><strong>Bold</strong> text</p>")).toBe(
        "Bold text",
      );
    });

    it("should handle empty HTML", () => {
      expect(stripHtmlTags("<p></p>")).toBe("");
    });

    it("should trim whitespace", () => {
      expect(stripHtmlTags("<p>  Hello  </p>")).toBe("Hello");
    });

    it("should return plain text unchanged", () => {
      expect(stripHtmlTags("Plain text")).toBe("Plain text");
    });
  });
});
