import { Router } from "express";

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

// Public routes

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUser'
 *     responses:
 *       '201':
 *         description: User registered successfully
 *       '400':
 *         description: Validation error
 *       '429':
 *         description: Too many login attempts
 */
router.post(
  "/register",
  validate(registerUserSchema), // Use schema directly
  authController.register,
);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       '200':
 *         description: Login successful
 *       '400':
 *         description: Invalid credentials
 */
router.post("/login", validate(userLoginSchema), authController.login);

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Refresh authentication token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRefreshToken'
 *     responses:
 *       '200':
 *         description: Token refreshed
 *       '400':
 *         description: Invalid refresh token
 *       '429':
 *         description: Too many attempts
 */
router.post(
  "/refresh-token",
  validate(userRefreshTokenSchema),
  authController.refreshToken,
);

// Protected routes

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Logout successful
 *       '401':
 *         description: Unauthorized
 *       '429':
 *         description: Too many attempts
 */
router.post("/logout", authMiddleware.authenticate, authController.logout);

// router.post(
//   "/logout-all",
//   authMiddleware.authenticate,
//   authController.logoutAll,
// );

/**
 * @swagger
 * /profile/{profileId}:
 *   get:
 *     summary: Get user profile by ID
 *     parameters:
 *       - name: profileId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Profile data
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Profile not found
 *       '429':
 *         description: Too many attempts
 */
router.get(
  "/profile/:profileId",
  authMiddleware.authenticate,
  authController.getProfile,
);

/**
 * @swagger
 * /change-password:
 *   post:
 *     summary: Change user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangeUserPassword'
 *     responses:
 *       '200':
 *         description: Password changed
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '429':
 *         description: Too many attempts
 */
router.post(
  "/change-password",
  authMiddleware.authenticate,
  validate(changeUserPasswordSchema),
  authController.changePassword,
);

export default router;
