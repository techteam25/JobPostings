import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { BaseController } from './base.controller';
import { ValidationError, ForbiddenError, NotFoundError } from '../utils/errors';

interface AuthRequest extends Request {
  userId?: number;
  sessionId?: number;
  user?: { id: number; role: string; email: string; firstName?: string; lastName?: string };
}

export class UserController extends BaseController {
  private userService: UserService;
  private authService: AuthService;

  constructor() {
    super();
    this.userService = new UserService();
    this.authService = new AuthService();
  }

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const { page, limit } = this.extractPaginationParams(req);
      const { search } = this.extractSearchParams(req);
      const role = req.query.role as string | undefined;

      const result = await this.userService.getAllUsers({
        page,
        limit,
        searchTerm: search,
        role,
      });

      this.sendPaginatedResponse(res, result.items, result.pagination, 'Users retrieved successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to retrieve users', 500);
    }
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id ?? '', 10);
      if (isNaN(id)) {
        throw new ValidationError('Invalid user ID');
      }

      const user = await this.userService.getUserById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      this.sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to retrieve user', 404);
    }
  };

  updateUser = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id ?? '', 10);
      if (isNaN(id)) {
        throw new ValidationError('Invalid user ID');
      }

      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      if (req.user.role !== 'admin' && req.user.id !== id) {
        throw new ForbiddenError('You can only update your own account');
      }

      const updateData = req.body;
      const user = await this.userService.updateUser(
        id,
        updateData,
        req.user.id,
        req.user.role
      );

      this.sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to update user', 400);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        throw new ValidationError('User not authenticated');
      }

      const profileData = req.body;
      const user = await this.userService.updateUserProfile(req.userId, profileData);
      this.sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to update profile', 400);
    }
  };

  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        throw new ValidationError('User not authenticated');
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw new ValidationError('Current password and new password are required');
      }

      await this.userService.changePassword(req.userId, currentPassword, newPassword);
      this.sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to change password', 400);
    }
  };

  getCurrentUser = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      this.sendSuccess(res, req.user, 'Current user retrieved successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to retrieve current user', 401);
    }
  };

  deactivateUser = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id ?? '', 10);
      if (isNaN(id)) {
        throw new ValidationError('Invalid user ID');
      }

      if (!req.user || req.user.role !== 'admin') {
        throw new ForbiddenError('Only admins can deactivate users');
      }

      const result = await this.userService.deactivateUser(id, req.user.id);
      this.sendSuccess(res, result, 'User deactivated successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to deactivate user', 400);
    }
  };

  activateUser = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id ?? '', 10);
      if (isNaN(id)) {
        throw new ValidationError('Invalid user ID');
      }

      if (!req.user || req.user.role !== 'admin') {
        throw new ForbiddenError('Only admins can activate users');
      }

      const result = await this.userService.activateUser(id);
      this.sendSuccess(res, result, 'User activated successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to activate user', 400);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        throw new ValidationError('Email is required');
      }

      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      if (req.user.role !== 'admin' && req.user.email !== email) {
        throw new ForbiddenError('You can only delete your own account or must be an admin');
      }

      const result = await this.authService.deleteUser(email);
      this.sendSuccess(res, result, 'User deleted successfully', 200);
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to delete user', 400);
    }
  };

  getUserStats = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new ForbiddenError('Only admins can view user statistics');
      }

      const stats = {
        totalUsers: await this.userService.getUsersByRole('user'),
        totalEmployers: await this.userService.getUsersByRole('employer'),
        totalAdmins: await this.userService.getUsersByRole('admin'),
      };

      this.sendSuccess(res, {
        users: stats.totalUsers.length,
        employers: stats.totalEmployers.length,
        admins: stats.totalAdmins.length,
        total: stats.totalUsers.length + stats.totalEmployers.length + stats.totalAdmins.length,
      }, 'User statistics retrieved successfully');
    } catch (error) {
      this.handleControllerError(res, error, 'Failed to retrieve user statistics', 400);
    }
  };
}