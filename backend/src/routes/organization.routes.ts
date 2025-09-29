import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationParamsSchema,
} from '../validations/organization.validation';

const router = Router();
const organizationController = new OrganizationController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.get('/', organizationController.getAllOrganizations);
router.get(
  '/:id',
  validateRequest(organizationParamsSchema),
  organizationController.getOrganizationById
);

// Protected routes
router.use(authMiddleware.authenticate);

router.post(
  '/',
  authMiddleware.requireRole(['admin', 'employer']),
  validateRequest(createOrganizationSchema),
  organizationController.createOrganization
);

router.put(
  '/:id',
  validateRequest({ ...organizationParamsSchema, ...updateOrganizationSchema }),
  authMiddleware.requireRole(['admin', 'employer']),
  organizationController.updateOrganization
);

router.delete(
  '/:id',
  validateRequest(organizationParamsSchema),
  authMiddleware.requireRole(['admin']),
  organizationController.deleteOrganization
);

export default router;
