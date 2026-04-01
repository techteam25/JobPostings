import { z } from "zod";
import { isPossiblePhoneNumber } from "libphonenumber-js";

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export const profileEditSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Display name is required")
      .max(100, "Display name must not exceed 100 characters"),
    bio: z.string().optional(),
    phoneNumber: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    linkedinUrl: z.string().optional(),
    portfolioUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.bio) return true;
      return stripHtmlTags(data.bio).length >= 10;
    },
    { message: "Bio must be at least 10 characters", path: ["bio"] },
  )
  .refine(
    (data) => {
      if (!data.bio) return true;
      return stripHtmlTags(data.bio).length <= 1000;
    },
    { message: "Bio must not exceed 1000 characters", path: ["bio"] },
  )
  .refine(
    (data) => {
      if (!data.phoneNumber) return true;
      return isPossiblePhoneNumber(data.phoneNumber, "US");
    },
    { message: "Invalid phone number", path: ["phoneNumber"] },
  )
  .refine(
    (data) => {
      if (!data.linkedinUrl) return true;
      try {
        new URL(data.linkedinUrl);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid LinkedIn URL", path: ["linkedinUrl"] },
  )
  .refine(
    (data) => {
      if (!data.portfolioUrl) return true;
      try {
        new URL(data.portfolioUrl);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid portfolio URL", path: ["portfolioUrl"] },
  );

export type ProfileEditFormData = z.infer<typeof profileEditSchema>;
