import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import type { IdentityServicePort } from "@/modules/identity";
import type { IdentityRepositoryPort } from "@/modules/identity";
import type { OrgOwnershipQueryPort } from "@/modules/identity";
import type { EmailServicePort } from "@shared/ports/email-service.port";
import type { EventBusPort } from "@shared/events";
import { createUserDeactivatedEvent } from "@/modules/identity/events/user-deactivated.event";
import {
  AppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@shared/errors";
import { auth } from "@/utils/auth";
import type { UpdateUser } from "@/validations/userProfile.validation";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import { enqueueCandidateSearchSync } from "@shared/infrastructure/typesense.service/candidate-search-enqueue";

const WALK_AWAY_BLOCKED_MESSAGE =
  "You own organizations that must be transferred or deleted before you can leave your account.";

export class IdentityService
  extends BaseService
  implements IdentityServicePort
{
  constructor(
    private identityRepository: IdentityRepositoryPort,
    private emailService: EmailServicePort,
    private eventBus: EventBusPort,
    private orgOwnershipQuery: OrgOwnershipQueryPort,
  ) {
    super();
  }

  async updateUser(id: number, updateData: UpdateUser) {
    try {
      const existingUser = await this.identityRepository.findById(id);
      if (!existingUser) {
        return fail(new NotFoundError("User", id));
      }

      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.identityRepository.findByEmail(
          updateData.email,
        );
        if (emailExists) {
          return fail(new ValidationError("Email is already in use"));
        }
      }

      const { status: success } = await auth.api.updateUser({
        body: {
          name: updateData.fullName,
          image: updateData.image as string | undefined,
        },
      });
      if (!success) {
        return fail(new DatabaseError("Failed to update user"));
      }

      const updatedUser = await this.identityRepository.findUserById(id);
      if (!updatedUser) {
        return fail(new NotFoundError("User", id));
      }

      if (updateData.fullName || updateData.image) {
        await enqueueCandidateSearchSync(id, "updateProfile");
      }

      return ok(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to update user"));
    }
  }

  async deactivateSelf(userId: number) {
    try {
      const user = await this.identityRepository.findById(userId);

      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (user.status !== "active") {
        return fail(new ValidationError("Account is already deactivated"));
      }

      const walkAway = await this.prepareWalkAway(userId);
      if (walkAway.isFailure) {
        return walkAway;
      }

      const deactivatedUser =
        await this.identityRepository.deactivateUserAccount(userId, {
          status: "deactivated",
        });
      if (!deactivatedUser) {
        return fail(new DatabaseError("Failed to deactivate account"));
      }

      await this.emailService.sendAccountDeactivationConfirmation(
        userId,
        deactivatedUser.email,
        deactivatedUser.fullName,
      );

      // Publish domain event — notifications module will pause alerts asynchronously
      await this.eventBus.publish(
        createUserDeactivatedEvent({
          userId,
          email: deactivatedUser.email,
          deactivatedAt: new Date().toISOString(),
        }),
      );

      await enqueueCandidateSearchSync(userId, "deleteProfile");

      return ok(deactivatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to deactivate account"));
    }
  }

  async deactivateUser(id: number, requestingUserId: number) {
    try {
      if (id === requestingUserId) {
        return fail(
          new ValidationError("You cannot deactivate your own account"),
        );
      }

      const user = await this.identityRepository.findById(id);
      if (!user) {
        return fail(new NotFoundError("User", id));
      }

      if (user.status !== "active") {
        return fail(new ValidationError("User is already deactivated"));
      }

      const success = await this.identityRepository.update(id, {
        status: "deactivated",
      });
      if (!success) {
        return fail(new DatabaseError("Failed to deactivate user"));
      }

      await queueService.addJob(
        QUEUE_NAMES.EMAIL_QUEUE,
        "sendAccountDeactivationConfirmation",
        {
          userId: id,
          email: user.email,
          fullName: user.fullName,
        },
      );

      // Publish domain event — notifications module will pause alerts asynchronously
      await this.eventBus.publish(
        createUserDeactivatedEvent({
          userId: id,
          email: user.email,
          deactivatedAt: new Date().toISOString(),
        }),
      );

      await enqueueCandidateSearchSync(id, "deleteProfile");

      const updatedUser = await this.identityRepository.findUserById(id);
      if (!updatedUser) {
        return fail(new NotFoundError("User", id));
      }

      return ok(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to deactivate user"));
    }
  }

  async activateUser(id: number) {
    const user = await this.identityRepository.findById(id);
    if (!user) {
      return this.handleError(new NotFoundError("User", id));
    }

    if (user.status === "active") {
      return this.handleError(new ValidationError("User is already active"));
    }

    const success = await this.identityRepository.update(id, {
      status: "active",
    });
    if (!success) {
      return this.handleError(new DatabaseError("Failed to activate user"));
    }

    const updatedUser = await this.identityRepository.findUserById(id);
    if (!updatedUser) {
      return this.handleError(new NotFoundError("User", id));
    }

    await enqueueCandidateSearchSync(id, "updateProfile");

    return ok(updatedUser);
  }

  async getWalkAwayOrgs(userId: number) {
    try {
      const classification =
        await this.orgOwnershipQuery.classifyOwnedOrgs(userId);
      return ok(classification);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(
        new DatabaseError("Failed to query blocking owned organizations"),
      );
    }
  }

  /**
   * Classify owned orgs; refuse when any block; otherwise tear down solo orgs.
   * Used by self-deactivate and the account before-delete hook.
   */
  async prepareWalkAway(userId: number) {
    try {
      const classification =
        await this.orgOwnershipQuery.classifyOwnedOrgs(userId);

      if (classification.blocking.length > 0) {
        return fail(
          new ValidationError(WALK_AWAY_BLOCKED_MESSAGE, classification),
        );
      }

      if (classification.willBeDeleted.length > 0) {
        const orgIds = classification.willBeDeleted.map((org) => org.id);
        const teardown = await this.orgOwnershipQuery.teardownSoloOrgs(
          userId,
          orgIds,
        );

        if (teardown === "aborted") {
          const afterAbort =
            await this.orgOwnershipQuery.classifyOwnedOrgs(userId);
          return fail(
            new ValidationError(WALK_AWAY_BLOCKED_MESSAGE, afterAbort),
          );
        }
      }

      return ok(undefined);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      const message =
        error instanceof Error
          ? error.message
          : "Failed to prepare organization walk-away";
      return fail(new DatabaseError(message));
    }
  }
}
