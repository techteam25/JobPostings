import { z } from "@/swagger/registry";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  applicationNotes,
  organizationMembers,
  organizations,
  organizationInvitations,
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
// Base schema WITHOUT logo refinements (for use with .partial())
const insertOrganizationBaseSchema = createInsertSchema(organizations, {
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
    .optional()
    .openapi({
      type: "string",
      format: "binary",
      description: "Logo image file (max size 5MB)",
    }),
});

// Full insert schema WITH refinements (for creating new organizations)
export const insertOrganizationSchema = insertOrganizationBaseSchema
  .refine(
    (data) => {
      // Only validate logo if it's provided
      if (data.logo) {
        return data.logo.mimetype.startsWith("image/");
      }
      return true;
    },
    {
      message: "File must be an image",
      path: ["logo", "mimetype"],
    },
  )
  .refine(
    (data) => {
      // Only validate logo size if it's provided
      if (data.logo) {
        return data.logo.size <= 5 * 1024 * 1024;
      }
      return true;
    },
    {
      message: "File size must be under 5MB",
      path: ["logo", "size"],
    },
  );

// Update schema: use base schema, apply partial FIRST, then add refinements
export const updateOrganizationInputSchema = insertOrganizationBaseSchema
  .partial()
  .omit({ id: true, createdAt: true })
  .refine(
    (data) => {
      // Only validate logo if it's provided
      if (data.logo) {
        return data.logo.mimetype.startsWith("image/");
      }
      return true;
    },
    {
      message: "File must be an image",
      path: ["logo", "mimetype"],
    },
  )
  .refine(
    (data) => {
      // Only validate logo size if it's provided
      if (data.logo) {
        return data.logo.size <= 5 * 1024 * 1024;
      }
      return true;
    },
    {
      message: "File size must be under 5MB",
      path: ["logo", "size"],
    },
  );

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

export const uploadOrganizationLogoSchema = z.object({
  body: insertOrganizationBaseSchema.pick({ logo: true })
    .refine(
      (data) => {
        // Only validate logo if it's provided
        if (data.logo) {
          return data.logo.mimetype.startsWith("image/");
        }
        return true;
      },
      {
        message: "File must be an image",
        path: ["logo", "mimetype"],
      },
    )
    .refine(
      (data) => {
        // Only validate logo size if it's provided
        if (data.logo) {
          return data.logo.size <= 5 * 1024 * 1024;
        }
        return true;
      },
      {
        message: "File size must be under 5MB",
        path: ["logo", "size"],
      },
    ),
  params: organizationIdParamSchema,
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
export type UploadOrganizationLogoSchema = z.infer<
  typeof uploadOrganizationLogoSchema
>;
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

// Organization Invitation Schemas
export const selectOrganizationInvitationSchema =
  createSelectSchema(organizationInvitations);
export const insertOrganizationInvitationSchema = createInsertSchema(
  organizationInvitations,
  {
    email: z.string().email("Invalid email address").toLowerCase(),
    role: z.enum(["owner", "admin", "recruiter", "member"]),
  },
).omit({
  id: true,
  token: true,
  status: true,
  acceptedAt: true,
  cancelledAt: true,
  cancelledBy: true,
  expiredAt: true,
  createdAt: true,
  updatedAt: true,
});

export const createOrganizationInvitationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    role: z.enum(["owner", "admin", "recruiter", "member"]).default("member"),
  }),
  params: organizationIdParamSchema,
  query: z.object({}).strict(),
});

export const acceptOrganizationInvitationSchema = z.object({
  body: z.object({}).strict(),
  params: z.object({
    token: z.string().min(1, "Token is required"),
  }),
  query: z.object({}).strict(),
});

export const getOrganizationInvitationDetailsSchema = z.object({
  body: z.object({}).strict(),
  params: z.object({
    token: z.string().min(1, "Token is required"),
  }),
  query: z.object({}).strict(),
});

export const cancelOrganizationInvitationSchema = z.object({
  body: z.object({}).strict(),
  params: z
    .object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      invitationId: z.string().regex(/^\d+$/, "invitationId must be a number"),
    })
    .strict(),
  query: z.object({}).strict(),
});

export type OrganizationInvitation = z.infer<
  typeof selectOrganizationInvitationSchema
>;
export type NewOrganizationInvitation = z.infer<
  typeof insertOrganizationInvitationSchema
>;
export type CreateOrganizationInvitationInput = z.infer<
  typeof createOrganizationInvitationSchema
>;
export type AcceptOrganizationInvitationInput = z.infer<
  typeof acceptOrganizationInvitationSchema
>;
export type GetOrganizationInvitationDetailsInput = z.infer<
  typeof getOrganizationInvitationDetailsSchema
>;
export type CancelOrganizationInvitationInput = z.infer<
  typeof cancelOrganizationInvitationSchema
>;
