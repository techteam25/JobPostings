import { Router } from "express";
import { OrganizationController } from "@/controllers/organization.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationSchema,
  deleteOrganizationSchema,
} from "@/validations/organization.validation";
import { registry, z } from "@/swagger/registry";
import { selectOrganizationSchema } from "@/db/schema";
import { apiResponseSchema, errorResponseSchema } from "@/types";

const router = Router();
const organizationController = new OrganizationController();
const authMiddleware = new AuthMiddleware();

const organizationResponse = apiResponseSchema(selectOrganizationSchema);

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
          schema: organizationResponse,
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
  security: [{ bearerAuth: [] }],
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
  authMiddleware.requireRole(["admin", "employer"]),
  validate(createOrganizationSchema),
  organizationController.createOrganization,
);

registry.registerPath({
  method: "put",
  path: "/organizations/{organizationId}",
  summary: "Update an organization",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
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
  authMiddleware.requireRole(["admin", "employer"]),
  validate(updateOrganizationSchema),
  organizationController.updateOrganization,
);

registry.registerPath({
  method: "delete",
  path: "/organizations/{organizationId}",
  summary: "Delete an organization",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
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
  authMiddleware.requireRole(["admin"]),
  validate(deleteOrganizationSchema),
  organizationController.deleteOrganization,
);

export default router;
