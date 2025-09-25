import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(255).trim(),
    description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
    location: z.string().min(1, 'Location is required').max(255).trim(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'volunteer', 'internship', 'short-term-trip']),
    compensationType: z.enum(['paid', 'missionary', 'volunteer', 'stipend']),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    currency: z.string().length(3).default('USD'),
    isRemote: z.boolean().default(false),
    applicationDeadline: z.string().datetime().optional(),
    requiredSkills: z.string().optional(),
    preferredSkills: z.string().optional(),
    benefits: z.string().max(2000).optional(),
    employerId: z.number().int().positive().optional(),
  }).refine(
    (data) => !data.salaryMax || !data.salaryMin || data.salaryMax >= data.salaryMin,
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["salaryMax"],
    }
  ).refine(
    (data) => data.compensationType !== 'paid' || (data.salaryMin && data.salaryMin > 0),
    {
      message: "Paid positions must specify minimum salary",
      path: ["salaryMin"],
    }
  ),
});

export const updateJobSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(255).trim().optional(),
    description: z.string().min(50).max(5000).optional(),
    location: z.string().min(1).max(255).trim().optional(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'volunteer', 'internship', 'short-term-trip']).optional(),
    compensationType: z.enum(['paid', 'missionary', 'volunteer', 'stipend']).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    isRemote: z.boolean().optional(),
    isActive: z.boolean().optional(),
    applicationDeadline: z.string().datetime().optional(),
    requiredSkills: z.string().optional(),
    preferredSkills: z.string().optional(),
    benefits: z.string().max(2000).optional(),
  }),
});

export const jobApplicationSchema = z.object({
  body: z.object({
    coverLetter: z.string()
      .min(50, 'Cover letter must be at least 50 characters')
      .max(2000, 'Cover letter must not exceed 2000 characters')
      .optional(),
    resumeUrl: z.string().url('Invalid resume URL').optional(),
    customAnswers: z.string().max(5000).optional(),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'reviewed', 'shortlisted', 'interviewing', 'rejected', 'hired', 'withdrawn']),
    notes: z.string().max(1000).optional(),
    rating: z.number().int().min(1).max(5).optional(),
  }),
});

export const jobParamsSchema = z