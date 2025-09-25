import { eq, and, desc, asc, SQL } from 'drizzle-orm';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import { db } from '../db/connection';
import { AppError, ErrorCode, DatabaseError } from '../utils/errors';
import { buildPagination, countRecords, calculatePagination } from '../db/utils';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

export class BaseRepository<T extends MySqlTable> {
  protected table: T;
  protected resourceName: string;

  constructor(table: T, resourceName?: string) {
    this.table = table;
    this.resourceName = resourceName || 'resource';
  }

  async create(data: any): Promise<number> {
    try {
      const result = await db.insert(this.table).values(data);
      return result[0].insertId;
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.resourceName}`, error);
    }
  }

  async findById(id: number): Promise<any | null> {
    try {
      const result = await db
        .select()
        .from(this.table)
        .where(eq((this.table as any).id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.resourceName} by ID`, error);
    }
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginationResult<any>> {
    try {
      const { page = 1, limit = 10 } = options;
      const { offset } = buildPagination(page, limit);

      const items = await db
        .select()
        .from(this.table)
        .limit(limit)
        .offset(offset)
        .orderBy(desc((this.table as any).createdAt));

      const total = await countRecords(this.table);
      const pagination = calculatePagination(total, page, limit);

      return { items, pagination };
    } catch (error) {
      throw new DatabaseError(`Failed to retrieve ${this.resourceName} list`, error);
    }
  }

  async findByCondition(condition: SQL, options: PaginationOptions = {}): Promise<PaginationResult<any>> {
    try {
      const { page = 1, limit = 10 } = options;
      const { offset } = buildPagination(page, limit);

      const items = await db
        .select()
        .from(this.table)
        .where(condition)
        .limit(limit)
        .offset(offset)
        .orderBy(desc((this.table as any).createdAt));

      const total = await countRecords(this.table, condition);
      const pagination = calculatePagination(total, page, limit);

      return { items, pagination };
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.resourceName} by condition`, error);
    }
  }

  async update(id: number, data: any): Promise<boolean> {
    try {
      const result = await db
        .update(this.table)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq((this.table as any).id, id));

      return result[0].affectedRows > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to update ${this.resourceName}`, error);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(this.table)
        .where(eq((this.table as any).id, id));

      return result[0].affectedRows > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to delete ${this.resourceName}`, error);
    }
  }

  async softDelete(id: number): Promise<boolean> {
    try {
      return await this.update(id, { isActive: false });
    } catch (error) {
      throw new DatabaseError(`Failed to soft delete ${this.resourceName}`, error);
    }
  }

  async exists(id: number): Promise<boolean> {
    try {
      const result = await db
        .select({ id: (this.table as any).id })
        .from(this.table)
        .where(eq((this.table as any).id, id))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check if ${this.resourceName} exists`, error);
    }
  }

  async count(condition?: SQL): Promise<number> {
    try {
      return await countRecords(this.table, condition);
    } catch (error) {
      throw new DatabaseError(`Failed to count ${this.resourceName}`, error);
    }
  }

  // Helper method for batch operations
  async createMany(data: any[]): Promise<number[]> {
    try {
      const result = await db.insert(this.table).values(data);
      // Note: MySQL doesn't return multiple insert IDs easily, so we return empty array
      // You might need to implement this differently based on your specific needs
      return [];
    } catch (error) {
      throw new DatabaseError(`Failed to create multiple ${this.resourceName}`, error);
    }
  }

  // Helper method for updating multiple records
  async updateMany(condition: SQL, data: any): Promise<number> {
    try {
      const result = await db
        .update(this.table)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(condition);

      return result[0].affectedRows;
    } catch (error) {
      throw new DatabaseError(`Failed to update multiple ${this.resourceName}`, error);
    }
  }

  // Helper method for deleting multiple records
  async deleteMany(condition: SQL): Promise<number> {
    try {
      const result = await db
        .delete(this.table)
        .where(condition);

      return result[0].affectedRows;
    } catch (error) {
      throw new DatabaseError(`Failed to delete multiple ${this.resourceName}`, error);
    }
  }

  // Helper method for finding the first record matching a condition
  async findFirst(condition: SQL): Promise<any | null> {
    try {
      const result = await db
        .select()
        .from(this.table)
        .where(condition)
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.resourceName}`, error);
    }
  }

  // Helper method for checking if a record with condition exists
  async existsByCondition(condition: SQL): Promise<boolean> {
    try {
      const result = await db
        .select({ id: (this.table as any).id })
        .from(this.table)
        .where(condition)
        .limit(1);

      return result.length > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check ${this.resourceName} existence`, error);
    }
  }
}