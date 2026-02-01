import { z } from "zod";

export const jobAlertSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(1, "Description is required"),
  state: z.string().optional(),
  city: z.string().optional(),
  searchQuery: z.string().optional(),
  jobType: z.array(z.enum(["full_time", "part_time", "contract", "temporary", "intern"])).optional(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.array(z.string()).optional(),
  includeRemote: z.boolean().default(true),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
  isActive: z.boolean().default(true),
  isPaused: z.boolean().default(false),
}).refine(
  (data) => !!(data.searchQuery || data.jobType?.length || data.skills?.length ||
               data.experienceLevel?.length || data.city || data.state),
  { message: "At least one search criteria is required" }
);

export type JobAlertFormData = z.infer<typeof jobAlertSchema>;
