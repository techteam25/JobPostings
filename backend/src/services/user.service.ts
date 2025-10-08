import bcrypt from "bcrypt";
import { UserRepository } from "@/repositories/user.repository";
import { BaseService } from "./base.service";
import {
  users,
  type NewUserProfile,
  type UpdateUser,
  type User,
} from "@/db/schema";
import { NotFoundError, ValidationError, ForbiddenError } from "@/utils/errors";
import { PaginationMeta } from "@/types";
import { db } from "@/db/connection";
import { count, sql } from "drizzle-orm";

interface UserSearchOptions {
  page?: number;
  limit?: number;
  searchTerm?: string;
  role?: User["role"];
}

export class UserService extends BaseService {
  private userRepository: UserRepository;

  constructor() {
    super();
    this.userRepository = new UserRepository();
  }

  async getAllUsers(options: UserSearchOptions) {
    const { page = 1, limit = 10, searchTerm, role } = options;
    const result = await this.userRepository.searchUsers(
      searchTerm || "",
      role,
      {
        page,
        limit,
      },
    );
    return {
      items: result.items,
      pagination: result.pagination as PaginationMeta, // Ensure type consistency
    };
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findByIdWithProfile(id);
    if (!user) {
      return this.handleError(new NotFoundError("User", id));
    }

    return user;
  }

  async updateUser(
    id: number,
    updateData: UpdateUser,
    requestingUserId: number,
    requestingUserRole: string,
  ) {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      return this.handleError(new NotFoundError("User", id));
    }

    // Permission checks
    const isAdmin = requestingUserRole === "admin";
    const isSelfUpdate = requestingUserId === id;

    if (!isAdmin && !isSelfUpdate) {
      return this.handleError(
        new ForbiddenError("You can only update your own profile"),
      );
    }

    // Non-admins cannot change certain fields
    if (
      !isAdmin &&
      (updateData.role || updateData.organizationId !== undefined)
    ) {
      return this.handleError(
        new ForbiddenError(
          "Insufficient permissions to modify role or organization",
        ),
      );
    }

    // Validate email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.userRepository.findByEmail(
        updateData.email,
      );
      if (emailExists) {
        return this.handleError(new ValidationError("Email is already in use"));
      }
    }

    const success = await this.userRepository.update(id, updateData);
    if (!success) {
      return this.handleError(new Error("Failed to update user"));
    }

    return await this.getUserById(id);
  }

  async updateUserProfile(
    userId: number,
    profileData: Partial<NewUserProfile>,
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return this.handleError(new NotFoundError("User", userId));
    }

    await this.userRepository.updateProfile(userId, profileData);
    return await this.getUserById(userId);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return this.handleError(new NotFoundError("User", userId));
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return this.handleError(
        new ValidationError("Current password is incorrect"),
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, { passwordHash: newHash });

    return { message: "Password changed successfully" };
  }

  async deactivateUser(id: number, requestingUserId: number) {
    if (id === requestingUserId) {
      return this.handleError(
        new ValidationError("You cannot deactivate your own account"),
      );
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      return this.handleError(new NotFoundError("User", id));
    }

    if (!user.isActive) {
      return this.handleError(
        new ValidationError("User is already deactivated"),
      );
    }

    const success = await this.userRepository.update(id, { isActive: false });
    if (!success) {
      return this.handleError(new Error("Failed to deactivate user"));
    }

    return await this.getUserById(id);
  }

  async activateUser(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return this.handleError(new NotFoundError("User", id));
    }

    if (user.isActive) {
      return this.handleError(new ValidationError("User is already active"));
    }

    const success = await this.userRepository.update(id, { isActive: true });
    if (!success) {
      return this.handleError(new Error("Failed to activate user"));
    }

    return await this.getUserById(id);
  }

  async getUsersByRole(role: User["role"]) {
    try {
      return await this.userRepository.findByRole(role);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const result = await db
        .select({
          users: count(sql`CASE WHEN ${users.role} = 'user' THEN 1 END`),
          employers: count(
            sql`CASE WHEN ${users.role} = 'employer' THEN 1 END`,
          ),
          admins: count(sql`CASE WHEN ${users.role} = 'admin' THEN 1 END`),
          total: count(),
        })
        .from(users);

      const stats = result[0];

      if (!stats) {
        return {
          users: 0,
          employers: 0,
          admins: 0,
          total: 0,
        };
      }

      return {
        users: stats.users,
        employers: stats.employers,
        admins: stats.admins,
        total: stats.total,
      };
    } catch (error) {
      this.handleError(error);
    }
  }
}
