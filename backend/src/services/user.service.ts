import bcrypt from "bcrypt";
import { UserRepository } from "@/repositories/user.repository";
import { EmailService } from "@/services/email.service";
import { JobService } from "@/services/job.service";
import { BaseService } from "./base.service";
import {
  users,
  type UpdateUser,
  type User,
  UpdateUserProfile,
  NewUserProfile,
} from "@/db/schema";
import { NotFoundError, ValidationError, ForbiddenError } from "@/utils/errors";
import { PaginationMeta } from "@/types";
import { db } from "@/db/connection";
import { count, sql } from "drizzle-orm";
import { UserQuerySchema } from "@/validations/user.validation";
import { SecurityUtils } from "@/utils/security";

export class UserService extends BaseService {
  private userRepository: UserRepository;
  private emailService: EmailService;
  private jobService: JobService;

  constructor() {
    super();
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
    this.jobService = new JobService();
  }

  async getAllUsers(options: UserQuerySchema["query"]) {
    const { searchTerm, role } = options;

    const sanitizedSearchTerm = SecurityUtils.sanitizeInput(searchTerm || "");
    const page = Number(options.page || "1");
    const limit = Number(options.limit || "10");

    const result = await this.userRepository.searchUsers(
      sanitizedSearchTerm,
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

  async createUserProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return this.handleError(new NotFoundError("User", userId));
    }

    return await this.userRepository.createProfile(userId, profileData);
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

  async updateUserProfile(userId: number, profileData: UpdateUserProfile) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return this.handleError(new NotFoundError("User", userId));
    }

    return await this.userRepository.updateProfile(userId, profileData);
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

  async deactivateSelf(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return this.handleError(new NotFoundError("User", userId));
    }

    if (user.status !== 'active') {
      return this.handleError(
        new ValidationError("Account is already deactivated"),
      );
    }

    // Edge case: Check for active jobs if employer
    if (user.role === "employer" && user.organizationId) {
      const activeJobs = await this.jobService.getActiveJobsByOrganization(user.organizationId);
      if (activeJobs.length > 0) {
        return this.handleError(
          new ValidationError("Cannot deactivate account with active jobs"),
        );
      }
    }

    const success = await this.userRepository.update(userId, { status: 'deactivated' });
    if (!success) {
      return this.handleError(new Error("Failed to deactivate account"));
    }

    // Email notification
    await this.emailService.sendAccountDeactivationConfirmation(user.email, user.firstName);

    return await this.getUserById(userId);
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

    if (user.status !== 'active') {
      return this.handleError(
        new ValidationError("User is already deactivated"),
      );
    }

    // Edge case: Check for active jobs if employer
    if (user.role === "employer" && user.organizationId) {
      const activeJobs = await this.jobService.getActiveJobsByOrganization(user.organizationId);
      if (activeJobs.length > 0) {
        return this.handleError(
          new ValidationError("Cannot deactivate user with active jobs"),
        );
      }
    }

    const success = await this.userRepository.update(id, { status: 'deactivated' });
    if (!success) {
      return this.handleError(new Error("Failed to deactivate user"));
    }

    // Email notification
    await this.emailService.sendAccountDeactivationConfirmation(user.email, user.firstName);
    
    return await this.getUserById(id);
  }

  async activateUser(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return this.handleError(new NotFoundError("User", id));
    }

    if (user.status === 'active') {
      return this.handleError(new ValidationError("User is already active"));
    }

    const success = await this.userRepository.update(id, { status: 'active' });
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

  async deleteSelf(userId: number, currentPassword: string): Promise<void> {
  const user = await this.userRepository.findByIdWithPassword(userId);
  if (!user) {
    return this.handleError(new NotFoundError("User", userId));
  }

  if (user.status !== 'active') {
    return this.handleError(new ValidationError("Account is already deactivated or deleted"));
  }

  // Safeguard: Validate password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return this.handleError(new ValidationError("Current password is incorrect"));
  }

  // Business checks
  if (user.role === "employer" && user.organizationId) {
    const activeJobs = await this.jobService.getActiveJobsByOrganization(user.organizationId);
    if (activeJobs.length > 0) {
      return this.handleError(new ValidationError("Cannot delete account with active jobs"));
    }
  }
  // Notification email
  await this.emailService.sendAccountDeletionConfirmation(user.email, user.firstName);

  // Soft delete: Update status and timestamp
  const success = await this.userRepository.update(userId, {
    status: 'deleted',
    deletedAt: new Date(),
  });
  if (!success) {
    return this.handleError(new Error("Failed to delete account"));
  }

  // Clean up related data
  await Promise.all([
    this.userRepository.deleteSessionsByUserId(userId),
    this.jobService.deleteJobApplicationsByUserId(userId),
  ]);

  return;
}
}
