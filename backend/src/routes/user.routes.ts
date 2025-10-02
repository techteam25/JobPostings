import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import {
  getUserSchema,
  changeUserPasswordSchema,
  updateUserPayloadSchema,
} from "../validations/user.validation";

const router = Router();
const userController = new UserController();
const authMiddleware = new AuthMiddleware();

// All user routes require authentication
router.use(authMiddleware.authenticate);

// Current user routes
router.get("/me", userController.getCurrentUser);
router.put(
  "/me/profile",
  validate(updateUserPayloadSchema),
  userController.updateProfile,
);
router.post(
  "/me/change-password",
  validate(changeUserPasswordSchema),
  userController.changePassword,
);

// Admin only routes for user management
router.get(
  "/",
  authMiddleware.requireRole(["admin"]),
  userController.getAllUsers,
);

router.get(
  "/stats",
  authMiddleware.requireRole(["admin"]),
  userController.getUserStats,
);

// User management routes (admin or self)
router.get("/:id", validate(getUserSchema), userController.getUserById);

router.put(
  "/:id",
  validate(updateUserPayloadSchema),
  userController.updateUser,
);

// Admin-only user activation/deactivation
router.patch(
  "/:id/deactivate",
  validate(getUserSchema),
  authMiddleware.requireRole(["admin"]),
  userController.deactivateUser,
);

router.patch(
  "/:id/activate",
  validate(getUserSchema),
  authMiddleware.requireRole(["admin"]),
  userController.activateUser,
);

router.delete(
  "/:id",
  validate(getUserSchema),
  authMiddleware.requireRole(["admin"]),
  userController.deleteUser,
);

export default router;
