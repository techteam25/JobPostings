import { Request, Response } from 'express';
import { AuthService, LoginCredentials, RegisterData } from '../services/auth.service';
import { BaseController } from './base.controller';

export class AuthController extends BaseController {
  private authService: AuthService;

  constructor() {
    super();
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const userData: RegisterData = req.body;
      const result = await this.authService.register(userData);
      this.sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      this.sendError(res, message, 400);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const credentials: LoginCredentials = req.body;
      const result = await this.authService.login(credentials);
      this.sendSuccess(res, result, 'Login successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      this.sendError(res, message, 401);
    }
  };

  logout = async (req: Request, res: Response) => {
    this.sendSuccess(res, null, 'Logout successful');
  };
}