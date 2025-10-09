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
/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Get all organizations
 *     responses:
 *       '200':
 *         description: List of organizations
 */
router.get("/", organizationController.getAllOrganizations);

/**
 * @swagger
 * /organizations/{organizationId}:
 *   get:
 *     summary: Get organization by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *     responses:
 *       '200':
 *         description: Organization details
 *       '404':
 *         description: Organization not found
 */
router.get(
  "/:organizationId",
  validate(getOrganizationSchema),
  organizationController.getOrganizationById,
);

/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Create a new organization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrganization'
 *     responses:
 *       '201':
 *         description: Organization created
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 */
router.post(
  "/",
  authMiddleware.authenticate,
  authMiddleware.requireRole(["admin", "employer"]),
  validate(createOrganizationSchema),
  organizationController.createOrganization,
);

/**
 * @swagger
 * /organizations/{organizationId}:
 *   put:
 *     summary: Update an organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrganization'
 *     responses:
 *       '200':
 *         description: Organization updated
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Organization not found
 */
router.put(
  "/:organizationId",
  authMiddleware.authenticate,
  authMiddleware.requireRole(["admin", "employer"]),
  validate(updateOrganizationSchema),
  organizationController.updateOrganization,
);

/**
 * @swagger
 * /organizations/{organizationId}:
 *   delete:
 *     summary: Delete an organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Organization deleted
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Organization not found
 */
router.delete(
  "/:organizationId",
  authMiddleware.authenticate,
  authMiddleware.requireRole(["admin"]),
  validate(deleteOrganizationSchema),
  organizationController.deleteOrganization,
);

export default router;
