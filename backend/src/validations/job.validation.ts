import { z } from 'zod';

export const createJobSchema = {
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(255),
    description: z.string().min(50, 'Description must be at least 50 characters'),
    location: z.string().min(1, 'Location is required').max(255),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'volunteer', 'internship']),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    isRemote: z.boolean().default(false),
    applicationDeadline: z.string().datetime().optional(),
    requiredSkills: z.string().optional(),
    employerId: z.number().positive().optional(),
  }),
};

export const updateJobSchema = {
  body: z.object({
    title: z.string().min(5).max(255).optional(),
    description: z.string().min(50).optional(),
    location: z.string().min(1).max(255).optional(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'volunteer', 'internship']).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    isRemote: z.boolean().optional(),
    isActive: z.boolean().optional(),
    applicationDeadline: z.string().datetime().optional(),
    requiredSkills: z.string().optional(),
  }),
};

export const jobApplicationSchema = {
  body: z.object({
    coverLetter: z.string().max(2000, 'Cover letter must not exceed 2000 characters').optional(),
    resumeUrl: z.string().url('Invalid resume URL').optional(),
  }),
};

export const updateApplicationStatusSchema = {
  body: z.object({
    status: z.enum(['pending', 'reviewed', 'shortlisted', 'rejected', 'hired']),
    notes: z.string().max(1000).optional(),
  }),
};

export const jobParamsSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid job ID').transform(Number),
    jobId: z.string().regex(/^\d+$/, 'Invalid job ID').transform(Number),
    applicationId: z.string().regex(/^\d+$/, 'Invalid application ID').transform(Number),
    employerId: z.string().regex(/^\d+$/, 'Invalid employer ID').transform(Number),
  }),
};

export const jobSearchSchema = {
  query: z.object({
    search: z.string().optional(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'volunteer', 'internship']).optional(),
    location: z.string().optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
    isRemote: z.string().transform(val => val === 'true').optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};
