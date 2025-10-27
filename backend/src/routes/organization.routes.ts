import { Router } from "express";
import { OrganizationController } from "@/controllers/organization.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import {
  createOrganizationSchema,
  updateOrganizationInputSchema,
  getOrganizationSchema,
  deleteOrganizationSchema,
  updateOrganizationSchema,
  organizationJobApplicationsResponseSchema,
} from "@/validations/organization.validation";
import { registry, z } from "@/swagger/registry";
import { selectOrganizationSchema } from "@/validations/organization.validation";
import {
  apiResponseSchema,
  errorResponseSchema,
  paginationMetaSchema,
} from "@/types";
import { getJobApplicationSchema } from "@/validations/jobApplications.validation";
import { getJobSchema } from "@/validations/job.validation";

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
  organizationController.deleteOrganization,
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
  authMiddleware.requireJobPostingRole(),
  validate(getOrganizationSchema),
  validate(getJobSchema),
  validate(getJobApplicationSchema),
  organizationController.getJobApplicationsForOrganization,
);

export default router;
