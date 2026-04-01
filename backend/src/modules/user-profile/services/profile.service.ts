import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import type { ProfileServicePort } from "@/modules/user-profile";
import type { ProfileRepositoryPort } from "@/modules/user-profile";
import type { OrgRoleQueryPort } from "@/modules/user-profile/ports/org-query.port";
import type { IdentityWritePort } from "@/modules/user-profile/ports/identity-write.port";
import {
  AppError,
  DatabaseError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  BadRequestError,
} from "@shared/errors";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { PaginationMeta } from "@shared/types";
import { SecurityUtils } from "@shared/utils/security";
import type {
  NewUserProfile,
  UpdateUserProfile,
} from "@/validations/userProfile.validation";
import type { FileUploadJobData } from "@/validations/file.validation";
import { StorageFolder } from "@shared/constants/storage-folders";
import type { InsertEducation } from "@/validations/educations.validation";
import type { InsertWorkExperience } from "@/validations/workExperiences.validation";
import type { NewCertification } from "@/validations/certifications.validation";
import type { NewSkill } from "@/validations/skills.validation";
import { ProfilePictureFile } from "@/modules/user-profile/types/profile.module.types";

export class ProfileService extends BaseService implements ProfileServicePort {
  constructor(
    private profileRepository: ProfileRepositoryPort,
    private orgRoleQuery: OrgRoleQueryPort,
    private identityWrite: IdentityWritePort,
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

      const { fullName, ...profileFields } = profileData;

      // Update display name via the identity module (synchronous cross-module call).
      if (fullName) {
        const identityResult = await this.identityWrite.updateUserDisplayName(
          userId,
          fullName,
        );
        if (identityResult.isFailure) {
          return fail(identityResult.error);
        }
      }

      const updatedProfile = await this.profileRepository.updateProfile(
        userId,
        profileFields,
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

  async uploadProfilePicture(
    userId: number,
    file: ProfilePictureFile | undefined,
    correlationId: string,
  ) {
    if (!file) {
      return fail(new BadRequestError("No file uploaded"));
    }

    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new NotFoundError("Profile", userId));
      }

      await queueService.addJob<FileUploadJobData>(
        QUEUE_NAMES.FILE_UPLOAD_QUEUE,
        "uploadFile",
        {
          entityType: "user",
          entityId: user.profile.id.toString(),
          mergeWithExisting: true,
          tempFiles: [
            {
              originalname: file.originalname,
              tempPath: file.path,
              size: file.size,
              mimetype: file.mimetype,
            },
          ],
          userId: userId.toString(),
          folder: StorageFolder.PROFILE_PICTURES,
          correlationId,
        },
      );

      return ok({ message: "Profile picture upload initiated" });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to upload profile picture"));
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

      if (!user.profile) {
        return fail(new NotFoundError("Profile", userId));
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

  async changeWorkAvailability(
    userId: number,
    isAvailable: boolean | undefined = false,
  ) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      const updatedProfile =
        await this.profileRepository.updateWorkAvailability(
          userId,
          isAvailable,
        );

      if (!updatedProfile) {
        return fail(new DatabaseError("Failed to update work availability"));
      }

      return ok(updatedProfile);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update work availability"));
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
        await this.orgRoleQuery.checkHasElevatedRole(sessionUserId, roles),
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

  async completeOnboarding(
    userId: number,
    userInfo: { email: string; fullName: string },
  ) {
    try {
      const intent = await this.profileRepository.getUserIntent(userId);

      if (intent?.intent !== "seeker") {
        return fail(
          new ForbiddenError(
            "Only job seekers can complete onboarding via this endpoint",
          ),
        );
      }

      const transitioned =
        await this.profileRepository.completeOnboarding(userId);

      if (transitioned) {
        await queueService.addJob(QUEUE_NAMES.EMAIL_QUEUE, "sendWelcomeEmail", {
          userId,
          email: userInfo.email,
          fullName: userInfo.fullName,
        });
      }

      return ok({ status: "completed" as const });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to complete onboarding"));
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

  async batchAddEducations(
    userId: number,
    data: Omit<InsertEducation, "userProfileId">[],
  ) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const result = await this.profileRepository.batchAddEducations(
        user.profile.id,
        data,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to add education entries"));
    }
  }

  async updateEducation(
    educationId: number,
    data: Partial<Omit<InsertEducation, "userProfileId">>,
  ) {
    try {
      const result = await this.profileRepository.updateEducation(
        educationId,
        data,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update education"));
    }
  }

  async deleteEducation(educationId: number) {
    try {
      const result = await this.profileRepository.deleteEducation(educationId);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to delete education"));
    }
  }

  async batchAddWorkExperiences(
    userId: number,
    data: Omit<InsertWorkExperience, "userProfileId">[],
  ) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const result = await this.profileRepository.batchAddWorkExperiences(
        user.profile.id,
        data,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to add work experience entries"));
    }
  }

  async updateWorkExperience(
    workExperienceId: number,
    data: Partial<Omit<InsertWorkExperience, "userProfileId">>,
  ) {
    try {
      const result = await this.profileRepository.updateWorkExperience(
        workExperienceId,
        data,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update work experience"));
    }
  }

  async deleteWorkExperience(workExperienceId: number) {
    try {
      const result =
        await this.profileRepository.deleteWorkExperience(workExperienceId);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to delete work experience"));
    }
  }

  // Certification link/unlink/search

  async linkCertification(userId: number, certificationData: NewCertification) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const result = await this.profileRepository.linkCertification(
        user.profile.id,
        certificationData,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to link certification"));
    }
  }

  async unlinkCertification(userId: number, certificationId: number) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const result = await this.profileRepository.unlinkCertification(
        user.profile.id,
        certificationId,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to unlink certification"));
    }
  }

  async searchCertifications(query: string) {
    try {
      const result = await this.profileRepository.searchCertifications(query);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to search certifications"));
    }
  }

  // Skill link/unlink/search

  private static readonly MAX_SKILLS = 30;

  async linkSkill(userId: number, skillData: NewSkill) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const skillCount = await this.profileRepository.countUserSkills(
        user.profile.id,
      );

      if (skillCount >= ProfileService.MAX_SKILLS) {
        return fail(
          new ValidationError(
            `Maximum ${ProfileService.MAX_SKILLS} skills allowed. Remove a skill before adding a new one.`,
          ),
        );
      }

      const result = await this.profileRepository.linkSkill(
        user.profile.id,
        skillData,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to link skill"));
    }
  }

  async unlinkSkill(userId: number, skillId: number) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const result = await this.profileRepository.unlinkSkill(
        user.profile.id,
        skillId,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to unlink skill"));
    }
  }

  async searchSkills(query: string) {
    try {
      const result = await this.profileRepository.searchSkills(query);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to search skills"));
    }
  }
}
