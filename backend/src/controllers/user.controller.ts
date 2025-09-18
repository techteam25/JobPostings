import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { BaseController } from './base.controller';

interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export class UserController extends BaseController {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = req.query;
      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        searchTerm: search as string,
      };

      const result = await this.userService.getAllUsers(options);
      this.sendPaginatedResponse(res, result.items, result.pagination, 'Users retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve users';
      this.sendError(res, message);
    }
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'User ID is required', 400);
      }
      const id = parseInt(req.params.id);
      const user = await this.userService.getUserById(id);
      this.sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve user';
      const statusCode = message === 'User not found' ? 404 : 500;
      this.sendError(res, message, statusCode);
    }
  };

  updateUser = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'User ID is required', 400);
      }
      const id = parseInt(req.params.id);
      const updateData = req.body;

      // Users can only update their own profile unless they're admin
      if (req.user?.role !== 'admin' && req.userId !== id) {
        return this.sendError(res, 'You can only update your own profile', 403);
      }

      const user = await this.userService.updateUser(id, updateData);
      this.sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      this.sendError(res, message);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const profileData = req.body;

      const user = await this.userService.updateUserProfile(userId, profileData);
      this.sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      this.sendError(res, message);
    }
  };

  getCurrentUser = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = await this.userService.getUserById(userId);
      this.sendSuccess(res, user, 'Current user retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve current user';
      this.sendError(res, message);
    }
  };

  deactivateUser = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'User ID is required', 400);
      }
      const id = parseInt(req.params.id);
      const result = await this.userService.deactivateUser(id);
      this.sendSuccess(res, result, 'User deactivated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deactivate user';
      this.sendError(res, message);
    }
  };

  activateUser = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'User ID is required', 400);
      }
      const id = parseInt(req.params.id);
      const result = await this.userService.activateUser(id);
      this.sendSuccess(res, result, 'User activated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to activate user';
      this.sendError(res, message);
    }
  };
}