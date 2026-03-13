import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import type { ProfileServicePort } from "@/modules/user-profile";
import type { ProfileRepositoryPort } from "@/modules/user-profile";
import type { OrganizationRepositoryPort } from "@/ports/organization-repository.port";
import { AppError, DatabaseError, NotFoundError } from "@shared/errors";
import type { PaginationMeta } from "@shared/types";
import { SecurityUtils } from "@/utils/security";
import type {
  NewUserProfile,
  UpdateUserProfile,
} from "@/validations/userProfile.validation";

export class ProfileService extends BaseService implements ProfileServicePort {
  constructor(
    private profileRepository: ProfileRepositoryPort,
    private organizationRepository: OrganizationRepositoryPort,
  ) {
    super();
  }

  async getAllUsers(searchTerm: string = "", page: number, limit: number) {
    const sanitizedSearchTerm = SecurityUtils.sanitizeInput(searchTerm);

    try {
      const result = await this.profileRepository.searchUsers(
        sanitizedSearchTerm,
        { page, limit },
      );
      return ok({
        items: result.items,
        pagination: result.pagination as PaginationMeta,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve users"));
    }
  }

  async getUserById(id: number) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(id);
      if (!user) {
        return fail(new NotFoundError("User", id));
      }

      return ok(user);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve user"));
    }
  }

  async getUserProfileStatus(id: number) {
    try {
      const status = await this.profileRepository.getUserProfileStatus(id);
      if (!status) {
        return fail(
          new DatabaseError("Failed to retrieve user profile status"),
        );
      }

      return ok(status);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve user profile status"));
    }
  }

  async createUserProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      const profile = await this.profileRepository.createProfile(
        userId,
        profileData,
      );

      if (!profile) {
        return fail(new DatabaseError("Failed to create user profile"));
      }

      return ok(profile);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to create user profile"));
    }
  }

  async updateUserProfile(userId: number, profileData: UpdateUserProfile) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      const updatedProfile = await this.profileRepository.updateProfile(
        userId,
        profileData,
      );

      if (!updatedProfile) {
        return fail(new DatabaseError("Failed to update user profile"));
      }

      return ok(updatedProfile);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update user profile"));
    }
  }

  async changeUserProfileVisibility(
    userId: number,
    isPublic: boolean | undefined = false,
  ) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      const updatedProfile =
        await this.profileRepository.updateProfileVisibility(userId, isPublic);

      if (!updatedProfile) {
        return fail(new DatabaseError("Failed to update profile visibility"));
      }

      return ok(updatedProfile);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update profile visibility"));
    }
  }

  async canSeekJobs(sessionUserId: number) {
    try {
      return ok(await this.profileRepository.canSeekJobs(sessionUserId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to verify Job Seeker permission"));
    }
  }

  async hasPrerequisiteRoles(
    sessionUserId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ) {
    try {
      return ok(
        await this.organizationRepository.checkHasElevatedRole(
          sessionUserId,
          roles,
        ),
      );
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to verify organization roles"));
    }
  }

  async getAuthenticatedUserIntent(userId: number) {
    try {
      const intent = await this.profileRepository.getUserIntent(userId);
      if (!intent) {
        return fail(
          new DatabaseError("Failed to retrieve user onboarding intent"),
        );
      }

      return ok(intent);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(
        new DatabaseError("Failed to retrieve user onboarding intent"),
      );
    }
  }

  async getSavedJobsForUser(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      return ok(
        await this.profileRepository.getSavedJobsForUser(userId, page, limit),
      );
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to retrieve saved jobs"));
    }
  }

  async saveJobForCurrentUser(userId: number, jobId: number) {
    try {
      return ok(await this.profileRepository.saveJobForUser(userId, jobId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to save job"));
    }
  }

  async isJobSavedByUser(userId: number, jobId: number) {
    try {
      return ok(await this.profileRepository.isJobSavedByUser(userId, jobId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to check saved job status"));
    }
  }

  async unsaveJobForCurrentUser(userId: number, jobId: number) {
    try {
      return ok(await this.profileRepository.unsaveJobForUser(userId, jobId));
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to unsave job"));
    }
  }
}
