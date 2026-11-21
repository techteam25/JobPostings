import { fail, ok } from "@shared/result";
import { unlink } from "node:fs/promises";
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
  BadRequestError,
  ErrorCode,
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
import type { OrganizationRole } from "@/validations/organization.validation";
import type {
  FileUploadJobData,
  FileUploadResult,
} from "@/validations/file.validation";
import { StorageFolder } from "@shared/constants/storage-folders";
import {
  ProfilePictureFile,
  ResumeFile,
} from "@/modules/user-profile/types/profile.module.types";
import { db } from "@shared/db/connection";
import { userProfile } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  FileDeleteJobData,
  FileMetadata,
} from "@/validations/file.validation";
import { generateCorrelationId } from "@/validations/file.validation";
import { enqueueCandidateSearchSync } from "@shared/infrastructure/typesense.service/candidate-search-enqueue";
import logger from "@shared/logger";

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

      await enqueueCandidateSearchSync(userId, "updateProfile");

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

      await enqueueCandidateSearchSync(userId, "updateProfile");

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
    return this.enqueueProfileUpload(
      userId,
      file,
      correlationId,
      "profilePicture",
      StorageFolder.PROFILE_PICTURES,
    );
  }

  async uploadResume(
    userId: number,
    file: ResumeFile | undefined,
    correlationId: string,
  ) {
    return this.enqueueProfileUpload(
      userId,
      file,
      correlationId,
      "resume",
      StorageFolder.RESUMES,
    );
  }

  private async enqueueProfileUpload(
    userId: number,
    file: ProfilePictureFile | ResumeFile | undefined,
    correlationId: string,
    fieldName: "profilePicture" | "resume",
    folder: StorageFolder,
  ) {
    if (!file) {
      return fail(new BadRequestError("No file uploaded"));
    }

    let queued = false;
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new NotFoundError("Profile", userId));
      }

      let job;
      try {
        job = await queueService.addJob<FileUploadJobData>(
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
                fieldName,
              },
            ],
            userId: userId.toString(),
            folder,
            correlationId,
          },
        );
      } catch (error) {
        logger.error(
          { error, correlationId },
          "Profile upload queue unavailable",
        );
        throw new AppError(
          "Upload service is unavailable. Please try again.",
          503,
          ErrorCode.INTERNAL_ERROR,
        );
      }

      if (!job.id) {
        throw new AppError(
          "Upload job was not created",
          503,
          ErrorCode.INTERNAL_ERROR,
        );
      }
      queued = true;
      return ok({
        message:
          fieldName === "resume" ? "Resume queued" : "Profile picture queued",
        jobId: job.id,
        status: "queued" as const,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      logger.error({ error, correlationId }, "Failed to queue profile upload");
      return fail(new DatabaseError("Failed to prepare upload"));
    } finally {
      if (!queued) {
        try {
          await unlink(file.path);
        } catch (error) {
          logger.warn(
            { error, path: file.path },
            "Unable to remove unqueued upload",
          );
        }
      }
    }
  }

  async getUploadStatus(userId: number, jobId: string) {
    try {
      const queue = queueService.getQueue(QUEUE_NAMES.FILE_UPLOAD_QUEUE);
      if (!queue) {
        return fail(
          new AppError(
            "Upload service is unavailable",
            503,
            ErrorCode.INTERNAL_ERROR,
          ),
        );
      }
      const job = await queue.getJob(jobId);
      if (
        !job ||
        job.data.userId !== userId.toString() ||
        job.data.entityType !== "user"
      ) {
        return fail(new NotFoundError("Upload job"));
      }
      const state = await job.getState();
      if (state === "failed") {
        return ok({
          status: "failed" as const,
          message: "Upload failed. Please try again.",
        });
      }
      if (state === "completed") {
        const result = job.returnvalue as FileUploadResult;
        if (!result || result.failureCount > 0 || result.successCount < 1) {
          return ok({
            status: "failed" as const,
            message: "Upload failed. Please try again.",
          });
        }
        return ok({ status: "completed" as const, url: result.urls[0] });
      }
      return ok({
        status:
          state === "active" ? ("processing" as const) : ("queued" as const),
      });
    } catch (error) {
      logger.error({ error, jobId }, "Failed to read profile upload status");
      return fail(
        new AppError(
          "Upload status is unavailable",
          503,
          ErrorCode.INTERNAL_ERROR,
        ),
      );
    }
  }

  async deleteResume(userId: number) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new NotFoundError("Profile", userId));
      }

      const resumeUrl = user.profile.resumeUrl;
      if (!resumeUrl) {
        return fail(new BadRequestError("No resume to delete"));
      }

      // Update DB first (immediate for the user).
      const existingMetadata = Array.isArray(user.profile.fileMetadata)
        ? (user.profile.fileMetadata as FileMetadata[])
        : [];
      const filteredMetadata = existingMetadata.filter(
        (m) => m.url !== resumeUrl,
      );

      await db
        .update(userProfile)
        .set({
          resumeUrl: null,
          fileMetadata: filteredMetadata.length > 0 ? filteredMetadata : null,
        })
        .where(eq(userProfile.id, user.profile.id));

      // Enqueue Firebase Storage cleanup — retried automatically on failure.
      await queueService.addJob<FileDeleteJobData>(
        QUEUE_NAMES.FILE_DELETE_QUEUE,
        "deleteFile",
        {
          fileUrl: resumeUrl,
          entityType: "user",
          entityId: user.profile.id.toString(),
          correlationId: generateCorrelationId(),
        },
      );

      return ok({ message: "Resume deleted" });
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to delete resume"));
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

      await enqueueCandidateSearchSync(
        userId,
        isPublic ? "updateProfile" : "deleteProfile",
      );

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

      await enqueueCandidateSearchSync(userId, "updateProfile");

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

  async hasPrerequisiteRoles(sessionUserId: number, roles: OrganizationRole[]) {
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
        // Sync denormalized copy to user table (identity domain) for session cookie cache
        const syncResult = await this.identityWrite.syncIntentToUser(
          userId,
          "seeker",
          "completed",
        );

        if (syncResult.isFailure) {
          return fail(syncResult.error);
        }

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

  async initializeUserIntent(userId: number, intent: "seeker" | "employer") {
    try {
      // Source of truth (userOnBoarding table, profile module's domain)
      await this.profileRepository.initializeUserIntent(userId, intent);
      const persisted = await this.profileRepository.getUserIntent(userId);
      if (!persisted) {
        return fail(
          new DatabaseError("Failed to retrieve user onboarding intent"),
        );
      }
      // Sync denormalized copy to user table (identity domain) for session cookie cache
      const syncResult = await this.identityWrite.syncIntentToUser(
        userId,
        persisted.intent,
        persisted.status,
      );

      if (syncResult.isFailure) {
        return fail(syncResult.error);
      }

      return ok(undefined);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to initialize user intent"));
    }
  }
}
