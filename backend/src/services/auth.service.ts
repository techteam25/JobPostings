import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { BaseService } from './base.service';
import { env } from '../config/env';
import { NewUser } from '../db/schema/users';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends NewUser {
  password: string;
}

export class AuthService extends BaseService {
  private userRepository: UserRepository;

  constructor() {
    super();
    this.userRepository = new UserRepository();
  }

  async register(userData: RegisterData) {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const { password, ...userDataWithoutPassword } = userData;
      const userId = await this.userRepository.create({
        ...userDataWithoutPassword,
        passwordHash,
      });

      // Generate token
      const token = this.generateToken(Number(userId));

      return {
        userId: Number(userId),
        token,
        message: 'User registered successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async login(credentials: LoginCredentials) {
    try {
      const { email, password } = credentials;

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = this.generateToken(user.id);

      return {
        userId: user.id,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  private generateToken(userId: number): string {
    if (!env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(
      { userId, iat: Math.floor(Date.now() / 1000) },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token: string): { userId: number } {
    try {
      if (!env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}