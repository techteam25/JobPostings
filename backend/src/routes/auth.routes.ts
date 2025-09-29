import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema, 
  changePasswordSchema 
} from '../validations/auth.validation';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

let rateLimiter: RateLimitMiddleware;
let authRateLimit: any;
let refreshRateLimit: any;

try {
  rateLimiter = new RateLimitMiddleware();
  
  authRateLimit = rateLimiter.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per window
    keyGenerator: (req: any) => req.ip + '-auth',
  });

  refreshRateLimit = rateLimiter.createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 refresh attempts per window
  });
} catch (error) {
  authRateLimit = (req: any, res: any, next: any) => next();
  refreshRateLimit = (req: any, res: any, next: any) => next();
}

// Public routes
router.post('/register', 
  authRateLimit,
  validateBody(registerSchema), // Use schema directly
  authController.register
);

router.post('/login', 
  authRateLimit,
  validateBody(loginSchema), 
  authController.login
);

router.post('/refresh-token',
  refreshRateLimit,
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

// Protected routes
router.post('/logout', 
  authMiddleware.authenticate, 
  authController.logout
);

router.post('/logout-all',
  authMiddleware.authenticate,
  authController.logoutAll
);

router.get('/profile',
  authMiddleware.authenticate,
  authController.getProfile
);

router.post('/change-password',
  authMiddleware.authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;