// Zod schemas
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { certifications } from "@/db/schema";

export const selectCertificationsSchema = createSelectSchema(certifications);
export const insertCertificationsSchema = createInsertSchema(certifications, {
  certificationName: z
    .string()
    .min(1, "Certification name is required")
    .max(100),
});
export const updateCertificationsSchema = createUpdateSchema(
  certifications,
).omit({
  id: true,
});

export type Certification = z.infer<typeof selectCertificationsSchema>;
export type NewCertification = z.infer<typeof insertCertificationsSchema>;
export type UpdateCertification = z.infer<typeof updateCertificationsSchema>;
