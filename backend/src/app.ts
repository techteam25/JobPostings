import express, { Application, Request, Response, NextFunction } from 'express';
import exampleRouter from './routes/example';
import { checkDatabaseConnection } from './db/connection';
import { env } from './config/env';

// Create Express application
const app: Application = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (basic setup)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check route
app.get('/health', async (req: Request, res: Response) => {
  try {
    const isDatabaseHealthy = await checkDatabaseConnection();
    const healthStatus = {
      status: isDatabaseHealthy ? 'OK' : 'DEGRADED',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: {
        connected: isDatabaseHealthy,
        host: env.DB_HOST,
        port: env.DB_PORT,
        name: env.DB_NAME,
      },
      version: '1.0.0',
    };
    
    const statusCode = isDatabaseHealthy ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the API',
    version: '1.0.0',
  });
});

// Mount example router
app.use('/api/example', exampleRouter);

// 404 handler - this middleware runs when no routes match
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error.message);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

export default app;
