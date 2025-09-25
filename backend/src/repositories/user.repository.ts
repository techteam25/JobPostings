import { eq, and, or, like, count } from 'drizzle-orm';
import { users, userProfile, NewUser, NewUserProfile } from '../db/schema/users';
import { BaseRepository } from './base.repository';
import { db } from '../db/connection';
import { DatabaseError } from '../utils/errors';

export class UserRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

  async findByEmail(email: string) {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      console.log('findByEmail result:', result);
      return result[0] || null;
    } catch (error) {
      console.error('findByEmail error:', error);
      throw new Error(`Failed query: select * from users where email = ? \nparams: ${email}`);
    }
  }

  async findByIdWithProfile(id: number) {
    try {
      const result = await db
        .select()
        .from(users)
        .leftJoin(userProfile, eq(users.id, userProfile.userId))
        .where(eq(users.id, id));
      console.log('findByIdWithProfile result:', result);
      return result[0] || null;
    } catch (error) {
      console.error('findByIdWithProfile error:', error);
      throw new Error(`Failed query: select * from users left join user_profile where users.id = ? \nparams: ${id}`);
    }
  }

  async createWithProfile(userData: NewUser, profileData?: Partial<NewUserProfile>) {
    try {
      return await db.transaction(async (tx) => {
        const userResult = await tx.insert(users).values(userData);
        const userId = userResult[0].insertId;
        console.log('createWithProfile result:', userResult);
        console.log('createWithProfile userId:', userId);
        if (!userId) {
          throw new DatabaseError(`Invalid insertId returned: ${userResult[0].insertId}`);
        }

        if (profileData) {
          await tx.insert(userProfile).values({
            ...profileData,
            userId,
          });
        }

        return userId;
      });
    } catch (error) {
      console.error('createWithProfile error:', error);
      throw new Error(`Failed to create user with data: ${JSON.stringify(userData)}`);
    }
  }

    async deleteUser(userId: number) {
    try {
      // Check if user exists
      const user = await db.select().from(users).where(eq(users.id, userId));
      if (!user[0]) {
        throw new DatabaseError(`User with ID ${userId} not found`);
      }

      // Delete user (sessions and auth records are handled by ON DELETE CASCADE)
      // If userProfile does not have ON DELETE CASCADE, delete profiles first
      await db.delete(userProfile).where(eq(userProfile.userId, userId));
      await db.delete(users).where(eq(users.id, userId));

      console.log(`Deleted user with ID: ${userId}`);
    } catch (error) {
      console.error('deleteUser error:', error);
      throw new DatabaseError(`Failed to delete user with ID: ${userId}`);
    }
  }

  async updateProfile(userId: number, profileData: Partial<NewUserProfile>) {
    try {
      const existingProfile = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.userId, userId));

      if (existingProfile.length > 0) {
        return await db
          .update(userProfile)
          .set(profileData)
          .where(eq(userProfile.userId, userId));
      } else {
        return await db.insert(userProfile).values({
          ...profileData,
          userId,
        });
      }
    } catch (error) {
      console.error('updateProfile error:', error);
      throw new Error(`Failed to update profile for userId: ${userId}`);
    }
  }

  async searchUsers(
    searchTerm: string,
    role: string | undefined,
    options: { page?: number; limit?: number } = {}
  ) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (searchTerm) {
        conditions.push(
          or(
            like(users.firstName, `%${searchTerm}%`),
            like(users.lastName, `%${searchTerm}%`),
            like(users.email, `%${searchTerm}%`)
          )
        );
      }

      if (role) {
        conditions.push(eq(users.role, role));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereCondition)
        .limit(limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(users)
        .where(whereCondition);

      const total = totalResult[0]?.count ?? 0;

      const pagination = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      return { items, pagination };
    } catch (error) {
      console.error('searchUsers error:', error);
      throw new Error(`Failed to search users with term: ${searchTerm}`);
    }
  }

  async findByRole(role: (typeof users.role.enumValues)[number]) {
    try {
      return await db.select().from(this.table).where(eq(this.table.role, role));
    } catch (error) {
      console.error(`Failed to fetch users by role: ${role}`, error);
      throw new Error(`Failed to fetch users by role: ${role}`);
    }
  }
}