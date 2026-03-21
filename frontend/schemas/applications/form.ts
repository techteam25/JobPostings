import { z } from "zod";
import { jobApplicationSchema } from "./index";

// ─── File Upload Constants ─────────────────────────────────────────────────
export const RESUME_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const COVER_LETTER_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const COVER_LETTER_ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

// ─── Step 1: Resume Upload ─────────────────────────────────────────────────
export const step1ResumeSchema = z
  .custom<File>((val) => val instanceof File, "Please upload a file")
  .refine((file) => file.type === "application/pdf", "Please upload a PDF file")
  .refine(
    (file) => file.size <= RESUME_MAX_SIZE,
    "File size must be less than 5MB",
  );

// ─── Step 2: Cover Letter Upload ───────────────────────────────────────────
export const step2CoverLetterSchema = z
  .custom<File>((val) => val instanceof File, "Please upload a file")
  .refine(
    (file) =>
      (COVER_LETTER_ALLOWED_TYPES as readonly string[]).includes(file.type),
    "Please upload a PDF, DOC, or DOCX file",
  )
  .refine(
    (file) => file.size <= COVER_LETTER_MAX_SIZE,
    "File size must be less than 5MB",
  );

// ─── Step 3: Location Info ─────────────────────────────────────────────────
// Reuse the location fields from the existing jobApplicationSchema
export const step3LocationSchema = jobApplicationSchema.pick({
  country: true,
  city: true,
  state: true,
  zipcode: true,
});

// ─── Step 4: Custom Questions ──────────────────────────────────────────────
// Reuse the customAnswers schema from the existing jobApplicationSchema
export const step4QuestionsSchema = jobApplicationSchema.shape.customAnswers;

// ─── Composite: Full Application Form ──────────────────────────────────────
export const applicationFormSchema = z.object({
  resume: step1ResumeSchema.nullable(),
  coverLetter: step2CoverLetterSchema.nullable(),
  ...step3LocationSchema.shape,
  customAnswers: step4QuestionsSchema,
});

// ─── Type Exports ──────────────────────────────────────────────────────────
export type Step1ResumeInput = z.infer<typeof step1ResumeSchema>;
export type Step2CoverLetterInput = z.infer<typeof step2CoverLetterSchema>;
export type Step3LocationInput = z.infer<typeof step3LocationSchema>;
export type Step4QuestionsInput = z.infer<typeof step4QuestionsSchema>;
export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;
