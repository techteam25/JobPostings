import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

// Protected routes
router.post('/logout', authMiddleware.authenticate, authController.logout);

export default router;