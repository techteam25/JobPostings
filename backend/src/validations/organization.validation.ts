import { z } from "@/swagger/registry";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  applicationNotes,
  organizationMembers,
  organizations,
} from "@/db/schema";
import { getJobSchema } from "@/validations/job.validation";
import { getJobApplicationSchema } from "@/validations/jobApplications.validation";
import { searchParams } from "@/validations/base.validation";

// Zod schemas for validation
export const selectOrganizationSchema = createSelectSchema(organizations);
export const selectOrganizationMembersSchema =
  createSelectSchema(organizationMembers);
export const insertJobApplicationNoteSchema =
  createInsertSchema(applicationNotes);
export const insertOrganizationSchema = createInsertSchema(organizations, {
  name: z.string().min(1, "Name must be at least 1 characters").max(100),
  url: z.url("Invalid organization website URL"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 characters")
    .max(20)
    .optional(),
}).extend({
  logo: z
    .custom<Express.Multer.File>(
      (val) =>
        val != null &&
        typeof val === "object" &&
        "mimetype" in val &&
        "size" in val,
      {
        message: "Expected a valid Multer file",
      },
    )
    .refine((file) => file.mimetype.startsWith("image/"), {
      message: "File must be an image",
      path: ["mimetype"],
    })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size must be under 5MB",
      path: ["size"],
    })
    .optional()
    .openapi({
      type: "string",
      format: "binary",
      description: "Logo image file (max size 5MB)",
    }),
});
export const updateOrganizationInputSchema = insertOrganizationSchema
  .partial()
  .omit({ id: true, createdAt: true });

const organizationIdParamSchema = z.object({
  organizationId: z.string().regex(/^\d+$/, "organizationId is required"),
});

const updateJobStatusInput = z.object({
  status: z.enum([
    "pending",
    "reviewed",
    "shortlisted",
    "interviewing",
    "rejected",
    "hired",
    "withdrawn",
  ]),
});

export const getOrganizationJobApplicationsSchema = z.object({
  applicationId: z.number(),
  jobId: z.number(),
  applicantName: z.string(),
  applicantEmail: z.string(),
  status: z.enum([
    "pending",
    "reviewed",
    "shortlisted",
    "interviewing",
    "rejected",
    "hired",
    "withdrawn",
  ]),
  coverLetter: z.string().nullable(),
  resumeUrl: z.string().nullable(),
  appliedAt: z.date(),
  reviewedAt: z.date().nullable(),
  jobTitle: z.string(),
  organizationId: z.number(),
  organizationName: z.string(),
});

const createJobApplicationNoteInput = z.object({
  note: z.string().min(1, "Note cannot be empty"),
});

export const createOrganizationSchema = z.object({
  body: insertOrganizationSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const updateOrganizationSchema = z.object({
  body: updateOrganizationInputSchema,
  params: organizationIdParamSchema,
  query: z.object({}).strict(),
});

export const getOrganizationSchema = z.object({
  body: z.object({}).strict(),
  query: searchParams.shape["query"]
    .pick({
      limit: true,
      page: true,
      q: true,
      sortBy: true,
      order: true,
    })
    .strict(),
  params: organizationIdParamSchema,
});

export const updateJobStatusInputSchema = z.object({
  body: updateJobStatusInput,
  params: z
    .object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    })
    .strict(),
  query: z.object({}).strict(),
});

export const createJobApplicationNoteSchema = z.object({
  body: createJobApplicationNoteInput,
  params: z
    .object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    })
    .strict(),
  query: z.object({}).strict(),
});

export const jobApplicationsManagementSchema = z.object({
  body: z.object({}).strict(),
  params: z
    .object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
    })
    .strict(),
  query: z.object({}).strict(),
});

export const jobApplicationManagementSchema = z.object({
  body: z.object({}).strict(),
  params: z
    .object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    })
    .strict(),
  query: z.object({}).strict(),
});

export const jobApplicationsResponseSchema = z
  .object({
    resumeUrl: z.string().nullable(),
    coverLetter: z.string().nullable(),
    status: z.enum([
      "pending",
      "reviewed",
      "shortlisted",
      "interviewing",
      "rejected",
      "hired",
      "withdrawn",
    ]),
    appliedAt: z.date(),
    reviewedAt: z.date().nullable(),
    applicant: z.object({
      fullName: z.string(),
      email: z.email(),
    }),
  })
  .array();

export const organizationJobApplicationsResponseSchema = z.object({
  id: z.number(),
  jobId: z.number(),
  resumeUrl: z.string().nullable(),
  coverLetter: z.string().nullable(),
  status: z.enum([
    "pending",
    "reviewed",
    "shortlisted",
    "interviewing",
    "rejected",
    "hired",
    "withdrawn",
  ]),
  appliedAt: z.date(),
  jobTitle: z.string(),
  description: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  zipcode: z.number().nullable(),
  jobType: z.enum([
    "full-time",
    "part-time",
    "contract",
    "volunteer",
    "internship",
  ]),
  compensationType: z.enum(["paid", "missionary", "volunteer", "stipend"]),
  isRemote: z.boolean(),
  isActive: z.boolean(),
  applicationDeadline: z.date().nullable(),
  experience: z.string().nullable(),
  organizationId: z.number(),
  organizationName: z.string(),
});

export const deleteOrganizationSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),
  params: organizationIdParamSchema,
});

export type NewOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = z.infer<typeof selectOrganizationSchema>;

export type OrganizationMember = z.infer<
  typeof selectOrganizationMembersSchema
>;

export type OrganizationWithMembers = Organization & {
  members: {
    id: number;
    organizationId: number;
    userId: number;
    role: "owner" | "admin" | "recruiter" | "member";
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    memberName: string;
    memberEmail: string;
    memberEmailVerified: boolean;
    memberStatus: string;
  }[];
};

export type GetOrganizationSchema = z.infer<typeof getOrganizationSchema>;
export type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationSchema = z.infer<typeof updateOrganizationSchema>;
export type DeleteOrganizationSchema = z.infer<typeof deleteOrganizationSchema>;
export type JobApplicationManagementSchema = z.infer<
  typeof jobApplicationManagementSchema
>;
export type JobApplicationsManagementSchema = z.infer<
  typeof jobApplicationsManagementSchema
>;
export type OrganizationJobApplicationsResponse = z.infer<
  typeof organizationJobApplicationsResponseSchema
>;
export type OrganizationJobApplications = z.infer<
  typeof getOrganizationJobApplicationsSchema
>;
export type JobApplicationsResponseSchema = z.infer<
  typeof jobApplicationsResponseSchema
>;
export type UpdateJobStatusInputSchema = z.infer<
  typeof updateJobStatusInputSchema
>;
export type CreateJobApplicationNoteInputSchema = z.infer<
  typeof createJobApplicationNoteSchema
>;
export type NewJobApplicationNote = z.infer<
  typeof insertJobApplicationNoteSchema
>;
