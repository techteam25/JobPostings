// Zod schemas
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { certifications } from "@/db/schema";

export const selectCertificationsSchema = createSelectSchema(certifications);
export const insertCertificationsSchema = createInsertSchema(certifications, {
  certificationName: z
    .string()
    .min(1, "Certification name is required")
    .max(100),
});

// Route-level validation schemas
const certificationParamsSchema = z.object({
  certificationId: z.string().regex(/^\d+$/, "Invalid certification ID format"),
});

export const linkCertificationSchema = z.object({
  body: z.object({
    certificationName: z
      .string()
      .min(1, "Certification name is required")
      .max(100, "Certification name must be 100 characters or less"),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const unlinkCertificationSchema = z.object({
  body: z.object({}),
  params: certificationParamsSchema,
  query: z.object({}),
});

export const searchCertificationsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    q: z.string().min(1, "Search query is required"),
  }),
});

// Type exports
export type Certification = z.infer<typeof selectCertificationsSchema>;
export type NewCertification = z.infer<typeof insertCertificationsSchema>;
export type LinkCertificationInput = z.infer<typeof linkCertificationSchema>;
export type UnlinkCertificationInput = z.infer<
  typeof unlinkCertificationSchema
>;
export type SearchCertificationsInput = z.infer<
  typeof searchCertificationsSchema
>;
