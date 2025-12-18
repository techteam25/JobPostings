import { Router } from "express";

import { OrganizationController } from "@/controllers/organization.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import { uploadMiddleware } from "@/middleware/multer.middleware";
import validate from "../middleware/validation.middleware";
import {
  createOrganizationSchema,
  updateOrganizationInputSchema,
  getOrganizationSchema,
  deleteOrganizationSchema,
  updateOrganizationSchema,
  organizationJobApplicationsResponseSchema,
  updateJobStatusInputSchema,
  createJobApplicationNoteSchema,
  getOrganizationJobApplicationsSchema,
} from "@/validations/organization.validation";
import { registry, z } from "@/swagger/registry";
import { selectOrganizationSchema } from "@/validations/organization.validation";
import {
  apiResponseSchema,
  errorResponseSchema,
  paginationMetaSchema,
} from "@/types";
import {
  getJobApplicationSchema,
  selectJobApplicationSchema,
} from "@/validations/jobApplications.validation";
import { getJobSchema } from "@/validations/job.validation";
import { getUserSchema } from "@/validations/user.validation";

const router = Router();
const organizationController = new OrganizationController();
const authMiddleware = new AuthMiddleware();

const organizationResponse = apiResponseSchema(selectOrganizationSchema);
const paginatedOrganizationResponse = apiResponseSchema(
  selectOrganizationSchema.array(),
).extend({
  pagination: paginationMetaSchema,
});

// Public routes

registry.registerPath({
  method: "get",
  path: "/organizations",
  summary: "Get all organizations",
  tags: ["Organizations"],
  responses: {
    200: {
      description: "List of organizations",
      content: {
        "application/json": {
          schema: paginatedOrganizationResponse,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get("/", organizationController.getAllOrganizations);

registry.registerPath({
  method: "get",
  path: "/organizations/{organizationId}",
  summary: "Get organization by ID",
  tags: ["Organizations"],
  request: {
    params: getOrganizationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Organization details",
      content: {
        "application/json": {
          schema: organizationResponse,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get(
  "/:organizationId",
  validate(getOrganizationSchema),
  organizationController.getOrganizationById,
);

registry.registerPath({
  method: "get",
  path: "/organizations/members/{memberId}",
  summary: "Get organization ID by member ID",
  tags: ["Organizations"],
  request: {
    params: getOrganizationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Organization ID",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              organizationId: z.number(),
            }),
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization member not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get(
  "/members/:id",
  validate(getUserSchema),
  organizationController.getOrganizationIdByMemberId,
);

registry.registerPath({
  method: "post",
  path: "/organizations",
  summary: "Create a new organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createOrganizationSchema.shape["body"],
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: "Organization created",
      content: {
        "application/json": {
          schema: organizationResponse,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.post(
  "/",
  authMiddleware.authenticate,
  uploadMiddleware.organizationLogo,
  validate(createOrganizationSchema),
  organizationController.createOrganization,
);

registry.registerPath({
  method: "put",
  path: "/organizations/{organizationId}",
  summary: "Update an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: updateOrganizationSchema.shape["params"],
    body: {
      content: {
        "application/json": {
          schema: updateOrganizationSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Organization updated",
      content: {
        "application/json": {
          schema: organizationResponse,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.put(
  "/:organizationId",
  authMiddleware.authenticate,
  authMiddleware.requireAdminOrOwnerRole(["owner"]),
  validate(updateOrganizationInputSchema),
  authMiddleware.ensureIsOrganizationMember,
  organizationController.updateOrganization,
);

registry.registerPath({
  method: "delete",
  path: "/organizations/{organizationId}",
  summary: "Delete an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: deleteOrganizationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Organization deleted",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              message: z.string(),
            }),
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.delete(
  "/:organizationId",
  authMiddleware.authenticate,
  authMiddleware.requireAdminOrOwnerRole(["owner"]),
  validate(deleteOrganizationSchema),
  authMiddleware.ensureIsOrganizationMember,
  organizationController.deleteOrganization,
);

registry.registerPath({
  method: "get",
  path: "/organizations/{organizationId}/jobs/{jobId}/applications",
  summary: "Get job applications for an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: z.object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
    }),
  },
  responses: {
    200: {
      description: "List of job applications",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            organizationJobApplicationsResponseSchema.array(),
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Job not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get(
  "/:organizationId/jobs/:jobId/applications",
  authMiddleware.authenticate,
  authMiddleware.requireJobPostingRole(),
  validate(getOrganizationSchema),
  validate(getJobSchema),
  authMiddleware.ensureIsOrganizationMember,
  organizationController.getJobApplicationsForOrganization,
);

registry.registerPath({
  method: "get",
  path: "/organizations/{organizationId}/jobs/{jobId}/applications/{applicationId}",
  summary: "Get a job application for an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: z.object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    }),
  },
  responses: {
    200: {
      description: "Job application details",
      content: {
        "application/json": {
          schema: apiResponseSchema(organizationJobApplicationsResponseSchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Job application not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get(
  "/:organizationId/jobs/:jobId/applications/:applicationId",
  authMiddleware.authenticate,
  authMiddleware.requireJobPostingRole(),
  validate(getOrganizationSchema),
  validate(getJobSchema),
  validate(getJobApplicationSchema),
  authMiddleware.ensureIsOrganizationMember,
  organizationController.getJobApplicationForOrganization,
);

registry.registerPath({
  method: "patch",
  path: "/organizations/{organizationId}/jobs/{jobId}/applications/{applicationId}/status",
  summary: "Update job application status for an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: z.object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    }),
    body: {
      content: {
        "application/json": {
          schema: updateJobStatusInputSchema.shape["body"],
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Job application status updated",
      content: {
        "application/json": {
          schema: apiResponseSchema(organizationJobApplicationsResponseSchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Job application not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.patch(
  "/:organizationId/jobs/:jobId/applications/:applicationId/status",
  authMiddleware.authenticate,
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  validate(updateJobStatusInputSchema),
  authMiddleware.ensureIsOrganizationMember,
  organizationController.updateJobApplicationStatus,
);

registry.registerPath({
  method: "post",
  path: "/organizations/{organizationId}/jobs/{jobId}/applications/{applicationId}/notes",
  summary: "Attach a note to a job application",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: z.object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    }),
    body: {
      content: {
        "application/json": {
          schema: createJobApplicationNoteSchema.shape["body"],
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: "Note attached to job application",
      content: {
        "application/json": {
          schema: apiResponseSchema(selectJobApplicationSchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Job application not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.post(
  "/:organizationId/jobs/:jobId/applications/:applicationId/notes",
  authMiddleware.authenticate,
  authMiddleware.requireJobPostingRole(),
  validate(createJobApplicationNoteSchema),
  authMiddleware.ensureIsOrganizationMember,
  organizationController.attachNoteToJobApplication,
);

registry.registerPath({
  method: "get",
  path: "/organizations/{organizationId}/jobs/{jobId}/applications/{applicationId}/notes",
  summary: "Get notes for a job application",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: z.object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    }),
  },
  responses: {
    200: {
      description: "List of notes for the job application",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z
              .object({
                note: z.string(),
                createdAt: z.date(),
              })
              .array(),
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Job application not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get(
  "/:organizationId/jobs/:jobId/applications/:applicationId/notes",
  authMiddleware.authenticate,
  authMiddleware.requireJobPostingRole(),
  validate(getOrganizationSchema),
  validate(getJobSchema),
  validate(getJobApplicationSchema),
  authMiddleware.ensureIsOrganizationMember,
  organizationController.getNotesForJobApplication,
);

registry.registerPath({
  method: "get",
  path: "/organizations/{organizationId}/applications",
  summary: "Get all applications for an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: getOrganizationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "List of applications for the organization",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            getOrganizationJobApplicationsSchema.array(),
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get(
  "/:organizationId/applications",
  authMiddleware.authenticate,
  authMiddleware.requireJobPostingRole(),
  authMiddleware.ensureIsOrganizationMember,
  validate(getOrganizationSchema),
  organizationController.getApplicationsForOrganization,
);

export default router;
