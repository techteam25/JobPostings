import { z } from "zod";
import { countries } from "countries-list";
import {
  isPossiblePhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

import { normalizeUrl } from "@/lib/url";

export function stripHtmlTags(html: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return html
    .replace(/<\/?(?:p|div|br|li)\b[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#(?:x[\da-f]+|\d+)|[a-z]+);/gi, (match, entity: string) => {
      if (entity.startsWith("#")) {
        const isHex = entity[1]?.toLowerCase() === "x";
        const codePoint = Number.parseInt(
          entity.slice(isHex ? 2 : 1),
          isHex ? 16 : 10,
        );
        return Number.isFinite(codePoint) && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : match;
      }
      return entities[entity.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function phoneCountryCode(country?: string): CountryCode {
  if (!country) return "US";
  const entry = Object.entries(countries).find(
    ([code, value]) => code === country || value.name === country,
  );
  return (entry?.[0] ?? "US") as CountryCode;
}

export function isProfilePhonePossible(
  phone: string,
  country?: string,
): boolean {
  return isPossiblePhoneNumber(phone, phoneCountryCode(country));
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
      .max(100, "Display name must not exceed 100 characters")
      .trim(),
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
      const length = stripHtmlTags(data.bio).length;
      return length === 0 || length >= 10;
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
      return isProfilePhonePossible(data.phoneNumber, data.country);
    },
    { message: "Invalid phone number", path: ["phoneNumber"] },
  )
  .transform((data) => {
    if (data.bio && stripHtmlTags(data.bio).length === 0) data.bio = "";
    if (data.phoneNumber) {
      data.phoneNumber = parsePhoneNumberFromString(
        data.phoneNumber,
        phoneCountryCode(data.country),
      )?.number;
    }
    return data;
  });

export type ProfileEditFormData = z.infer<typeof profileEditSchema>;
