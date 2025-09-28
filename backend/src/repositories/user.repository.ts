import { eq, and, or, like, count } from 'drizzle-orm';
import { users, userProfile, NewUser, NewUserProfile, SafeUser, UserProfile } from '../db/schema/users';
import { BaseRepository } from './base.repository';
import { db } from '../db/connection';
import { DatabaseError } from '../utils/errors';

export class UserRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    try {
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          organizationId: users.organizationId,
          isEmailVerified: users.isEmailVerified,
          isActive: users.isActive,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.email, email));
      return result[0] || null;
    } catch (error) {
      console.error('UserRepository.findByEmail error:', error);
      throw new DatabaseError(`Failed to query user by email: ${email}`, error instanceof Error ? error : undefined);
    }
  }

  async findByIdWithProfile(id: number): Promise<{ users: SafeUser; userProfile: UserProfile | null } | null> {
    try {
      const result = await db
        .select({
          users: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            organizationId: users.organizationId,
            isEmailVerified: users.isEmailVerified,
            isActive: users.isActive,
            lastLoginAt: users.lastLoginAt,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          },
          userProfile: {
            id: userProfile.id,
            userId: userProfile.userId,
            profilePicture: userProfile.profilePicture,
            bio: userProfile.bio,
            resumeUrl: userProfile.resumeUrl,
            linkedinUrl: userProfile.linkedinUrl,
            portfolioUrl: userProfile.portfolioUrl,
            phoneNumber: userProfile.phoneNumber,
            address: userProfile.address,
            city: userProfile.city,
            state: userProfile.state,
            country: userProfile.country,
            zipCode: userProfile.zipCode,
            createdAt: userProfile.createdAt,
            updatedAt: userProfile.updatedAt,
          },
        })
        .from(users)
        .leftJoin(userProfile, eq(users.id, userProfile.userId))
        .where(eq(users.id, id));
      return result[0] || null;
    } catch (error) {
      console.error('UserRepository.findByIdWithProfile error:', error);
      throw new DatabaseError(`Failed to query user with profile by id: ${id}`, error instanceof Error ? error : undefined);
    }
  }

  async create(userData: NewUser): Promise<number> {
    try {
      const result = await db.insert(users).values(userData);
      const userId = result[0].insertId;
      if (!userId || isNaN(userId)) {
        throw new DatabaseError(`Invalid insertId returned: ${result[0].insertId}`);
      }
      return userId;
    } catch (error) {
      console.error('UserRepository.create error:', error);
      throw new DatabaseError(`Failed to create user with data: ${JSON.stringify(userData)}`, error instanceof Error ? error : undefined);
    }
  }

  async createWithProfile(userData: NewUser, profileData?: Partial<NewUserProfile>): Promise<number> {
    try {
      return await db.transaction(async (tx) => {
        const userResult = await tx.insert(users).values(userData);
        const userId = userResult[0].insertId;
        if (!userId || isNaN(userId)) {
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
      console.error('UserRepository.createWithProfile error:', error);
      throw new DatabaseError(`Failed to create user with data: ${JSON.stringify(userData)}`, error instanceof Error ? error : undefined);
    }
  }

  async deleteUser(userId: number): Promise<void> {
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
    } catch (error) {
      console.error('UserRepository.deleteUser error:', error);
      throw new DatabaseError(`Failed to delete user with ID: ${userId}`, error instanceof Error ? error : undefined);
    }
  }

  async updateProfile(userId: number, profileData: Partial<NewUserProfile>): Promise<void> {
    try {
      const existingProfile = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.userId, userId));

      if (existingProfile.length > 0) {
        await db
          .update(userProfile)
          .set(profileData)
          .where(eq(userProfile.userId, userId));
      } else {
        await db.insert(userProfile).values({
          ...profileData,
          userId,
        });
      }
    } catch (error) {
      console.error('UserRepository.updateProfile error:', error);
      throw new DatabaseError(`Failed to update profile for userId: ${userId}`, error instanceof Error ? error : undefined);
    }
  }

  async searchUsers(
    searchTerm: string,
    role: 'user' | 'employer' | 'admin' | undefined,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ items: SafeUser[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
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
          organizationId: users.organizationId,
          isEmailVerified: users.isEmailVerified,
          isActive: users.isActive,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
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

      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('UserRepository.searchUsers error:', error);
      throw new DatabaseError(`Failed to search users with term: ${searchTerm}`, error instanceof Error ? error : undefined);
    }
  }

  async findByRole(role: 'user' | 'employer' | 'admin'): Promise<SafeUser[]> {
    try {
      return await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          organizationId: users.organizationId,
          isEmailVerified: users.isEmailVerified,
          isActive: users.isActive,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.role, role));
    } catch (error) {
      console.error(`UserRepository.findByRole error for role ${role}:`, error);
      throw new DatabaseError(`Failed to fetch users by role: ${role}`, error instanceof Error ? error : undefined);
    }
  }
}