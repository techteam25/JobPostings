import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { skills } from "@/db/schema";

export const selectSkillsSchema = createSelectSchema(skills);
export const insertSkillsSchema = createInsertSchema(skills, {
  name: z.string().min(1, "Skill name is required").max(100),
});

// Route-level validation schemas
const skillParamsSchema = z.object({
  skillId: z.string().regex(/^\d+$/, "Invalid skill ID format"),
});

export const linkSkillSchema = z.object({
  body: z.object({
    skillName: z
      .string()
      .min(1, "Skill name is required")
      .max(100, "Skill name must be 100 characters or less"),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const unlinkSkillSchema = z.object({
  body: z.object({}),
  params: skillParamsSchema,
  query: z.object({}),
});

export const searchSkillsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    q: z.string().min(1, "Search query is required"),
  }),
});

// Type exports
export type Skill = z.infer<typeof selectSkillsSchema>;
export type NewSkill = z.infer<typeof insertSkillsSchema>;
export type LinkSkillInput = z.infer<typeof linkSkillSchema>;
export type UnlinkSkillInput = z.infer<typeof unlinkSkillSchema>;
export type SearchSkillsInput = z.infer<typeof searchSkillsSchema>;
