import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import validate from "../middleware/validation.middleware";
import { AuthMiddleware } from "../middleware/auth.middleware";
import {
  registerUserSchema,
  userLoginSchema,
  userRefreshTokenSchema,
  changeUserPasswordSchema,
} from "../validations/auth.validation";

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.post(
  "/register",
  validate(registerUserSchema), // Use schema directly
  authController.register,
);

router.post("/login", validate(userLoginSchema), authController.login);

router.post(
  "/refresh-token",
  validate(userRefreshTokenSchema),
  authController.refreshToken,
);

// Protected routes
router.post("/logout", authMiddleware.authenticate, authController.logout);

// router.post(
//   "/logout-all",
//   authMiddleware.authenticate,
//   authController.logoutAll,
// );

router.get(
  "/profile/:profileId",
  authMiddleware.authenticate,
  authController.getProfile,
);

router.post(
  "/change-password",
  authMiddleware.authenticate,
  validate(changeUserPasswordSchema),
  authController.changePassword,
);

export default router;
