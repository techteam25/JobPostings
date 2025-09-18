import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  updateUserSchema,
  updateProfileSchema,
  userParamsSchema,
} from '../validations/user.validation';

const router = Router();
const userController = new UserController();
const authMiddleware = new AuthMiddleware();

// All user routes require authentication
router.use(authMiddleware.authenticate);

// Current user routes
router.get('/me', userController.getCurrentUser);
router.put('/me/profile', validateRequest({ body: updateProfileSchema }), userController.updateProfile);

// Admin only routes
router.get(
  '/',
  authMiddleware.requireRole(['admin']),
  userController.getAllUsers
);

router.get(
  '/:id',
  validateRequest({ params: userParamsSchema }),
  userController.getUserById
);

router.put(
  '/:id',
  validateRequest({ params: userParamsSchema, body: updateUserSchema }),
  userController.updateUser
);

router.patch(
  '/:id/deactivate',
  validateRequest({ params: userParamsSchema }),
  authMiddleware.requireRole(['admin']),
  userController.deactivateUser
);

router.patch(
  '/:id/activate',
  validateRequest({ params: userParamsSchema }),
  authMiddleware.requireRole(['admin']),
  userController.activateUser
);

export default router;
