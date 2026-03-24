import { z } from "zod";

export const editOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name can't be longer than 100 characters"),
  streetAddress: z.string().min(1, "Street Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string(),
  country: z.string().min(1, "Country is required"),
  zipCode: z.string(),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  url: z.url("Invalid URL format").nonempty("Website URL is required"),
  mission: z.string().min(1, "Mission is required"),
});

export type EditOrganizationData = z.infer<typeof editOrganizationSchema>;
