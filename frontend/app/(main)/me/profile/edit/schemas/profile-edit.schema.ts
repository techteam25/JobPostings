import { z } from "zod";
import { isPossiblePhoneNumber } from "libphonenumber-js";

import { normalizeUrl } from "@/lib/url";

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

const optionalUrl = (message: string) =>
  z
    .string()
    .optional()
    .transform((v) => {
      const normalized = normalizeUrl(v);
      return normalized === "" ? undefined : normalized;
    })
    .pipe(z.string().url(message).optional());

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
    linkedinUrl: optionalUrl("Invalid LinkedIn URL"),
    portfolioUrl: optionalUrl("Invalid portfolio URL"),
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
  );

export type ProfileEditFormData = z.infer<typeof profileEditSchema>;
