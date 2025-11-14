import { z } from "zod";

export const createOrganizationSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name can't be longer than 100 characters"),
    streetAddress: z.string().min(1, "Street Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string(),
    country: z.string().min(1, "Country is required"),
    zipCode: z.string(),
    industry: z.string(),
    size: z.string(),
    url: z.string(),
    mission: z.string().min(1, "Mission is required"),
    phone: z.string(),
    logo: z.union([z.undefined(), z.file()]),
  })
  .refine((data) => data.country === "Unites States" && data.state.length > 0, {
    message: "State is required when country is United States",
  })
  .refine((data) => data.state.length > 0 && data.zipCode, {
    message: "Zip code is required when state is provided",
  })
  .refine(
    (data) =>
      !data.logo ||
      (data.logo instanceof File && data.logo.type.startsWith("image/")),
    {
      message: "Invalid file type. Must be an image",
      path: ["logo"],
    },
  )
  .refine((data) => !data.logo || data.logo.size <= 5 * 1024 * 1024, {
    message: "Image should be at most 5MB",
    path: ["logo"],
  });

export const generalCompanyInfoSchema = createOrganizationSchema.pick({
  name: true,
  industry: true,
  size: true,
  mission: true,
});

export const locationCompanyInfoSchema = createOrganizationSchema.pick({
  streetAddress: true,
  city: true,
  state: true,
  country: true,
  zipCode: true,
});

export const contactCompanyInfoSchema = createOrganizationSchema.pick({
  phone: true,
  url: true,
  logo: true,
});

export type CreateOrganizationData = z.infer<typeof createOrganizationSchema>;
export type GeneralCompanyInfoData = z.infer<typeof generalCompanyInfoSchema>;
export type LocationCompanyInfoData = z.infer<typeof locationCompanyInfoSchema>;
export type ContactCompanyInfoData = z.infer<typeof contactCompanyInfoSchema>;
