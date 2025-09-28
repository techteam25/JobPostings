import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest, TokenPayload } from '../db/interfaces/auth';
import { SafeUser } from '../db/schema/users';

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
      const decoded: TokenPayload = this.authService.verifyToken(token);
      req.userId = decoded.userId;
      req.sessionId = decoded.sessionId; // Assign sessionId if present in token

      return next();
    } catch (error) {
      return res.status(401).json({
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
        const user: SafeUser = await userService.getUserById(req.userId);
        
        if (!roles.includes(user.role)) {
          return res.status(403).json({
            status: 'error',
            message: 'Insufficient permissions',
          });
        }

        req.user = user;
        return next();
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: 'Error checking user permissions',
        });
      }
    };
  };

  requireActiveUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'User account is not active',
      });
    }
    return next();
  };
}