import { eq, and, or, like } from 'drizzle-orm';
import { users, userProfile, NewUser, NewUserProfile } from '../db/schema/users';
import { BaseRepository } from './base.repository';
import { db } from '../db/connection';

export class UserRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  }

  async findByIdWithProfile(id: number) {
    const result = await db
      .select()
      .from(users)
      .leftJoin(userProfile, eq(users.id, userProfile.userId))
      .where(eq(users.id, id));
    
    return result[0] || null;
  }

  async createWithProfile(userData: NewUser, profileData?: Partial<NewUserProfile>) {
    return await db.transaction(async (tx) => {
      const userResult = await tx.insert(users).values(userData);
      const userId = userResult.insertId;

      if (profileData) {
        await tx.insert(userProfile).values({
          ...profileData,
          userId: Number(userId),
        });
      }

      return userId;
    });
  }

  async updateProfile(userId: number, profileData: Partial<NewUserProfile>) {
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
  }

  async searchUsers(searchTerm: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    const { offset } = buildPagination(page, limit);

    const searchCondition = or(
      like(users.firstName, `%${searchTerm}%`),
      like(users.lastName, `%${searchTerm}%`),
      like(users.email, `%${searchTerm}%`)
    );

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
      .where(searchCondition)
      .limit(limit)
      .offset(offset);

    const total = await countRecords(users, searchCondition);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }
}