import { z } from "zod";

export const searchJobResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  description: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  isRemote: z.boolean(),
  experience: z.string().optional(),
  jobType: z.string(),
  skills: z.string().array(),
  createdAt: z.number(),
  logoUrl: z.string().optional(),
});

export type SearchJobResult = z.infer<typeof searchJobResultSchema>;
