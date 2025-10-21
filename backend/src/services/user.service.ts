import { UserRepository } from "@/repositories/user.repository";
import { EmailService } from "@/services/email.service";
import { BaseService } from "./base.service";
import { NotFoundError, ValidationError } from "@/utils/errors";
import { PaginationMeta } from "@/types";
import { UserQuerySchema } from "@/validations/user.validation";
import { SecurityUtils } from "@/utils/security";
import { auth } from "@/utils/auth";
import {
  NewUserProfile,
  UpdateUser,
  UpdateUserProfile,
} from "@/validations/userProfile.validation";
import { OrganizationRepository } from "@/repositories/organization.repository";

export class UserService extends BaseService {
  private userRepository: UserRepository;
  private emailService: EmailService;
  private organizationRepository: OrganizationRepository;

  constructor() {
    super();
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
    this.organizationRepository = new OrganizationRepository();
  }

  async getAllUsers(options: UserQuerySchema["query"]) {
    const { searchTerm } = options;

    const sanitizedSearchTerm = SecurityUtils.sanitizeInput(searchTerm || "");
    const page = Number(options.page || "1");
    const limit = Number(options.limit || "10");

    const result = await this.userRepository.searchUsers(sanitizedSearchTerm, {
      page,
      limit,
    });
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

  async updateUser(id: number, updateData: UpdateUser) {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      return this.handleError(new NotFoundError("User", id));
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

    const { status: success } = await auth.api.updateUser({
      body: {
        name: updateData.fullName,
        image: updateData.image as string | undefined,
      },
    });
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

    const res = await auth.api.changePassword({
      body: {
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      },
    });

    return { message: "Password changed successfully", data: res };
  }

  async deactivateSelf(userId: number) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return this.handleError(new NotFoundError("User", userId));
    }

    if (user.status !== "active") {
      return this.handleError(
        new ValidationError("Account is already deactivated"),
      );
    }

    const deactivatedUser = await this.userRepository.deactivateUserAccount(
      userId,
      {
        status: "deactivated",
      },
    );
    if (!deactivatedUser) {
      return this.handleError(new Error("Failed to deactivate account"));
    }

    // Email notification
    await this.emailService.sendAccountDeactivationConfirmation(
      deactivatedUser.email,
      deactivatedUser.fullName,
    );

    return deactivatedUser;
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

    if (user.status !== "active") {
      return this.handleError(
        new ValidationError("User is already deactivated"),
      );
    }

    // Todo: Check permissions with Better-Auth
    // Edge case: Check for active jobs if employer
    // if (user.role === "employer" && user.organizationId) {
    //   const activeJobs = await this.jobService.getActiveJobsByOrganization(
    //     user.organizationId,
    //   );
    //   if (activeJobs.length > 0) {
    //     return this.handleError(
    //       new ValidationError("Cannot deactivate user with active jobs"),
    //     );
    //   }
    // }

    const success = await this.userRepository.update(id, {
      status: "deactivated",
    });
    if (!success) {
      return this.handleError(new Error("Failed to deactivate user"));
    }

    // Email notification
    await this.emailService.sendAccountDeactivationConfirmation(
      user.email,
      user.fullName,
    );

    return await this.getUserById(id);
  }

  async activateUser(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return this.handleError(new NotFoundError("User", id));
    }

    if (user.status === "active") {
      return this.handleError(new ValidationError("User is already active"));
    }

    const success = await this.userRepository.update(id, { status: "active" });
    if (!success) {
      return this.handleError(new Error("Failed to activate user"));
    }

    return await this.getUserById(id);
  }

  async canSeekJobs(sessionUserId: number) {
    return await this.userRepository.canSeekJobs(sessionUserId);
  }

  async hasPrerequisiteRoles(
    sessionUserId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ) {
    return await this.organizationRepository.checkHasElevatedRole(
      sessionUserId,
      roles,
    );
  }

  // Todo: Implement user statistics - Role no longer available directly on user
  // Get user statistics
  // async getUserStats() {
  //   try {
  //     const result = await db
  //       .select({
  //         users: count(sql`CASE WHEN ${user.role} = 'user' THEN 1 END`),
  //         employers: count(
  //           sql`CASE WHEN ${user.role} = 'employer' THEN 1 END`,
  //         ),
  //         admins: count(sql`CASE WHEN ${user.role} = 'admin' THEN 1 END`),
  //         total: count(),
  //       })
  //       .from(user);
  //
  //     const stats = result[0];
  //
  //     if (!stats) {
  //       return {
  //         users: 0,
  //         employers: 0,
  //         admins: 0,
  //         total: 0,
  //       };
  //     }
  //
  //     return {
  //       users: stats.users,
  //       employers: stats.employers,
  //       admins: stats.admins,
  //       total: stats.total,
  //     };
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  async deleteSelf(userId: number, token: string): Promise<void> {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) {
      return this.handleError(new NotFoundError("User", userId));
    }

    const userDeleted = await auth.api.deleteUser({
      body: {
        token, // Todo: replace currentPassword with actual confirmation token
      },
    });

    // Notification email
    await this.emailService.sendAccountDeletionConfirmation(
      user.email,
      user.fullName,
    );

    if (!userDeleted) {
      return this.handleError(new Error("Failed to delete account"));
    }

    return;
  }
}
