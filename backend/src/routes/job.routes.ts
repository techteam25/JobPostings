import { Router } from "express";

import { JobController } from "@/controllers/job.controller";

import { AuthMiddleware } from "@/middleware/auth.middleware";

import validate from "../middleware/validation.middleware";
import {
  selectJobSchema,
  createJobSchema,
  updateJobInputSchema,
  getJobSchema,
  deleteJobSchema,
  updateJobSchema,
  applyForJobSchema,
} from "@/validations/job.validation";
import { searchJobResult, searchParams } from "@/validations/base.validation";
import { updateApplicationStatusSchema } from "@/validations/jobApplications.validation";
import { selectOrganizationSchema } from "@/validations/organization.validation";

import { registry, z } from "@/swagger/registry";

import {
  apiResponseSchema,
  errorResponseSchema,
  paginatedResponseSchema,
  paginationMetaSchema,
} from "@/types";

const router = Router();
const jobController = new JobController();
const authMiddleware = new AuthMiddleware();

const jobResponseSchema = apiResponseSchema(selectJobSchema);

// Public routes

registry.registerPath({
  method: "get",
  path: "/api/jobs",
  summary: "Get all job postings with optional filters",
  tags: ["Jobs"],
  request: {
    query: searchParams.shape["query"],
  },
  responses: {
    200: {
      description: "List of job postings",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z
              .object({
                job: selectJobSchema,
                employer: selectOrganizationSchema.pick({
                  id: true,
                  name: true,
                  city: true,
                  state: true,
                }),
              })
              .array(),
          ).extend({
            pagination: paginationMetaSchema,
          }),
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get("/", validate(searchParams), jobController.getAllJobs);

registry.registerPath({
  method: "get",
  path: "/api/jobs/search",
  summary: "Search job postings",
  tags: ["Jobs"],
  request: {
    query: searchParams.shape["query"],
  },
  responses: {
    200: {
      description: "Search results",
      content: {
        "application/json": {
          schema: paginatedResponseSchema.extend({
            data: searchJobResult.array(),
          }),
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get("/search", validate(searchParams), jobController.searchJobs);
// router.get("/stats", jobController.getJobStats);

registry.registerPath({
  method: "get",
  path: "/api/jobs/{jobId}",
  summary: "Get job posting by ID",
  tags: ["Jobs"],
  request: {
    params: getJobSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Job details",
      content: {
        "application/json": {
          schema: jobResponseSchema,
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
      description: "Job not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get("/:jobId", validate(getJobSchema), jobController.getJobById);
router.get(
  "/:jobId/similar",
  validate(getJobSchema),
  jobController.getSimilarJobs,
);

// Protected routes - authentication required
router.use(authMiddleware.authenticate);

// User routes (authenticated users)
router.get(
  "/recommendations/me",
  authMiddleware.requireUserRole(),
  jobController.getRecommendedJobs,
);

router.get(
  "/applications/my",
  authMiddleware.requireUserRole(),
  jobController.getUserApplications,
);

router.post(
  "/:jobId/apply",
  authMiddleware.requireUserRole(),
  validate(applyForJobSchema),
  jobController.applyForJob,
);

router.patch(
  "/applications/:applicationId/withdraw",
  authMiddleware.requireUserRole(),
  authMiddleware.requireApplicationOwnership(),
  validate(getJobSchema),
  jobController.withdrawApplication,
);

registry.registerPath({
  method: "patch",
  path: "/api/jobs/applications/{applicationId}/withdraw",
  summary: "Withdraw a job application",
  description:
    "Allows an authenticated user to withdraw their submitted job application. The user must own the application. Once withdrawn, the application status is updated to 'withdrawn'.",
  tags: ["Job Applications"],
  request: {
    params: getJobSchema.shape["params"], // validates applicationId param
  },
  responses: {
    200: {
      description: "Application withdrawn successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              message: z.string().describe("Confirmation message"),
              applicationId: z.number().describe("The ID of the withdrawn application"),
              status: z.string().describe("Updated status of the application (e.g. 'withdrawn')"),
            }),
          ),
        },
      },
    },
    400: {
      description: "Validation error or invalid application ID",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized — user not logged in",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden — user does not own this application",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Application not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});


// Employer routes
router.get(
  "/my/posted",
  authMiddleware.requireJobPostingRole(),
  jobController.getMyJobs,
);

registry.registerPath({
  method: "post",
  path: "/api/jobs",
  summary: "Create a new job posting",
  tags: ["Jobs"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createJobSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    201: {
      description: "Job created successfully",
      content: {
        "application/json": {
          schema: jobResponseSchema,
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
      description: "Internal server error",
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
  authMiddleware.requireJobPostingRole(),
  validate(createJobSchema),
  jobController.createJob,
);

registry.registerPath({
  method: "put",
  path: "/api/jobs/{jobId}",
  summary: "Update an existing job posting",
  tags: ["Jobs"],
  request: {
    params: updateJobSchema.shape["params"],
    body: {
      content: {
        "application/json": {
          schema: updateJobSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Job updated successfully",
      content: {
        "application/json": {
          schema: jobResponseSchema,
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
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.put(
  "/:jobId",
  authMiddleware.requireJobPostingRole(),
  validate(updateJobInputSchema),
  jobController.updateJob,
);

registry.registerPath({
  method: "delete",
  path: "/api/jobs/{jobId}",
  summary: "Delete a job posting",
  tags: ["Jobs"],
  request: {
    params: deleteJobSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Job deleted successfully",
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
      description: "Job not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.delete(
  "/:jobId",
  authMiddleware.requireJobPostingRole(),
  validate(deleteJobSchema),
  jobController.deleteJob,
);

router.get(
  "/:jobId/applications",
  authMiddleware.requireJobPostingRole(),
  validate(getJobSchema),
  jobController.getJobApplications,
);

router.patch(
  "/applications/:applicationId/status",
  authMiddleware.requireJobPostingRole(),
  validate(updateApplicationStatusSchema),
  jobController.updateApplicationStatus,
);

// Organization-specific routes
router.get(
  "/employer/:employerId",
  authMiddleware.requireJobPostingRole(),
  validate(getJobSchema),
  jobController.getJobsByEmployer,
);

// Dashboard routes
// router.get(
//   "/dashboard/data",
//   authMiddleware.requireActiveUser,
//   jobController.getDashboardData,
// );

export default router;
