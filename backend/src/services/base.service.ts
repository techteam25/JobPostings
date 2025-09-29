import { AppError, DatabaseError, ValidationError } from '../utils/errors';

export abstract class BaseService {
  protected handleError(error: any): never {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error) {
      // Handle specific database errors
      if (error.message.includes('Duplicate entry')) {
        throw new ValidationError('A record with this information already exists');
      }
      
      if (error.message.includes('foreign key constraint')) {
        throw new ValidationError('Cannot complete operation due to related records');
      }

      // Handle other known error types
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        throw new ValidationError(error.message);
      }

      // Database connection errors
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        throw new DatabaseError('Database connection error');
      }

      throw new AppError(error.message, 500);
    }

    // Handle unknown errors
    throw new AppError('An unexpected error occurred', 500);
  }

  protected validateInput(data: any, requiredFields: string[]): void {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid input data');
    }

    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  protected validateId(id: any): number {
    const numId = Number(id);
    
    if (isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
      throw new ValidationError('Invalid ID provided');
    }
    
    return numId;
  }

  protected sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}