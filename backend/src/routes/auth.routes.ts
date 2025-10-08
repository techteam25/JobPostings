import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { store } from "@/config/redis";
import { AuthController } from "@/controllers/auth.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import validate from "@/middleware/validation.middleware";
import {
  registerUserSchema,
  userLoginSchema,
  userRefreshTokenSchema,
  changeUserPasswordSchema,
} from "@/validations/auth.validation";

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false, // Count failed attempts
  message: "Too many login attempts, please try again later.",
  // Redis store configuration
  store,
});

// Public routes
router.post(
  "/register",
  authLimiter,
  validate(registerUserSchema), // Use schema directly
  authController.register,
);

router.post("/login", validate(userLoginSchema), authController.login);

router.post(
  "/refresh-token",
  authLimiter,
  validate(userRefreshTokenSchema),
  authController.refreshToken,
);

// Protected routes
router.post(
  "/logout",
  authLimiter,
  authMiddleware.authenticate,
  authController.logout,
);

// router.post(
//   "/logout-all",
//   authMiddleware.authenticate,
//   authController.logoutAll,
// );

router.get(
  "/profile/:profileId",
  authLimiter,
  authMiddleware.authenticate,
  authController.getProfile,
);

router.post(
  "/change-password",
  authLimiter,
  authMiddleware.authenticate,
  validate(changeUserPasswordSchema),
  authController.changePassword,
);

export default router;
