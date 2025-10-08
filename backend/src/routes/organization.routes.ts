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

const router = Router();
const organizationController = new OrganizationController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.get("/", organizationController.getAllOrganizations);
router.get(
  "/:id",
  validate(getOrganizationSchema),
  organizationController.getOrganizationById,
);

// Protected routes
router.use(authMiddleware.authenticate);

router.post(
  "/",
  authMiddleware.requireRole(["admin", "employer"]),
  validate(createOrganizationSchema),
  organizationController.createOrganization,
);

router.put(
  "/:id",
  authMiddleware.requireRole(["admin", "employer"]),
  validate(updateOrganizationSchema),
  organizationController.updateOrganization,
);

router.delete(
  "/:id",
  authMiddleware.requireRole(["admin"]),
  validate(deleteOrganizationSchema),
  organizationController.deleteOrganization,
);

export default router;
