import { Request, Response, NextFunction } from 'express';
import { handleDatabaseError } from '../db/utils';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Handle database errors
  const dbError = handleDatabaseError(error);
  if (dbError.statusCode !== 500) {
    return res.status(dbError.statusCode).json({
      status: 'error',
      message: dbError.message,
      code: dbError.code,
    });
  }

    // Default error response
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};