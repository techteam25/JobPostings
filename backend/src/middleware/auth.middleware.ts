import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '../types';

interface AuthRequest extends Request {
  userId?: number;
  user?: User;
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          status: 'error',
          message: 'No token provided',
        });
      }

      const token = authHeader.substring(7);
      const decoded = this.authService.verifyToken(token);
      req.userId = decoded.userId;

      next();
    } catch (error) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
    }
  };

  requireRole = (roles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.userId) {
          return res.status(401).json({
            status: 'error',
            message: 'Authentication required',
          });
        }

        // Fetch user to check role
        const userService = new (await import('../services/user.service.js')).UserService();
        const user = await userService.getUserById(req.userId);
        
        if (!roles.includes(user.role)) {
          return res.status(403).json({
            status: 'error',
            message: 'Insufficient permissions',
          });
        }

        req.user = user;
        next();
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Error checking user permissions',
        });
      }
    };
  };
}
