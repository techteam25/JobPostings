import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import exampleRoutes from './example';
import { sanitizeInput } from '../middleware/validation.middleware';

const router = Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// API version info
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Job Listing API',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        base: '/auth',
        routes: {
          'POST /auth/register': 'Register a new user',
          'POST /auth/login': 'Login user',
          'POST /auth/logout': 'Logout current session',
          'POST /auth/logout-all': 'Logout all sessions',
          'POST /auth/refresh-token': 'Refresh access token',
          'POST /auth/change-password': 'Change user password',
          'GET /auth/profile': 'Get current user profile',
        },
      },
      users: {
        base: '/users',
        routes: {
          'GET /users': 'Get all users (admin only)',
          'GET /users/me': 'Get current user',
          'GET /users/stats': 'Get user statistics (admin only)',
          'GET /users/:id': 'Get user by ID',
          'PUT /users/me/profile': 'Update current user profile',
          'PUT /users/:id': 'Update user (admin or self)',
          'POST /users/me/change-password': 'Change password',
          'PATCH /users/:id/activate': 'Activate user (admin only)',
          'PATCH /users/:id/deactivate': 'Deactivate user (admin only)',
        },
      },
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/example', exampleRoutes);

export default router;