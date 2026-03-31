import { AuthMiddleware } from "@/middleware/auth.middleware";
import { EmailService } from "@shared/infrastructure/email.service";
import { TypesenseJobService } from "@shared/infrastructure/typesense.service/typesense.service";
import { TypesenseUserProfileService } from "@shared/infrastructure/typesense.service/typesense-user-profile.service";
import { BullMqEventBus } from "@shared/events";

// Module composition roots
import { createOrganizationsModule } from "@/modules/organizations";
import { createIdentityModule } from "@/modules/identity";
import { createUserProfileModule } from "@/modules/user-profile";
import {
  createNotificationsModule,
  NotificationsRepository,
} from "@/modules/notifications";
import { createJobBoardModule } from "@/modules/job-board";
import { createApplicationsModule } from "@/modules/applications";
import { createInvitationsModule } from "@/modules/invitations";

// Concrete repositories — only the central composition root instantiates these
import { JobBoardRepository } from "@/modules/job-board";
import { JobInsightsRepository } from "@/modules/job-board";
import { ApplicationsRepository } from "@/modules/applications";

// Cross-module adapters
import {
  OrganizationsToProfileAdapter,
  OrganizationsToJobBoardAdapter,
  OrganizationsToApplicationsAdapter,
  OrganizationsToInvitationsAdapter,
  IdentityToNotificationsAdapter,
  IdentityToApplicationsAdapter,
  IdentityToInvitationsAdapter,
  IdentityToJobBoardAdapter,
  ApplicationsToJobBoardAdapter,
  JobBoardToApplicationsAdapter,
  ProfileToJobBoardAdapter,
  FileMetadataUpdateAdapter,
  JobBoardToSharedInsightsAdapter,
} from "@shared/adapters";

// Shared workers
import { createFileUploadWorker } from "@shared/workers/file-upload.worker";
import { createDomainEventWorker } from "@shared/workers/domain-event.worker";
import { createTempFileCleanupWorker } from "@shared/workers/temp-file-cleanup.worker";

// Auth dependency injection
import { setAuthDependencies } from "@/utils/auth";

import type { RequestHandler } from "express";
import type { IdentityModule } from "@/modules/identity";
import type { UserProfileModule } from "@/modules/user-profile";
import type { NotificationsModule } from "@/modules/notifications";
import type { JobBoardModule } from "@/modules/job-board";
import type { ApplicationsModule } from "@/modules/applications";
import type { OrganizationsModule } from "@/modules/organizations";
import type { InvitationsModule } from "@/modules/invitations";
import type { ModuleWorkers } from "@shared/types/module-workers";

import logger from "@shared/logger";

/**
 * Public API of the composition root — only exposes controller + guards per module,
 * plus a workers orchestrator for background job initialization.
 */
export type CompositionRoot = {
  authenticate: RequestHandler;
  identity: Pick<IdentityModule, "controller" | "guards">;
  userProfile: Pick<
    UserProfileModule,
    "controller" | "preferenceController" | "workAreaController" | "guards"
  >;
  notifications: Pick<NotificationsModule, "controller">;
  jobBoard: Pick<JobBoardModule, "controller" | "guards">;
  applications: Pick<ApplicationsModule, "controller" | "guards">;
  organizations: Pick<OrganizationsModule, "controller" | "guards">;
  invitations: Pick<InvitationsModule, "controller" | "guards">;
  workers: {
    initializeAll(): void;
    scheduleAllJobs(): Promise<void>;
  };
};

/**
 * Central composition root for the entire application.
 *
 * Creates all shared infrastructure, module instances, cross-module adapters,
 * and wires worker dependencies. Each module receives its dependencies through
 * constructor injection — no module instantiates its own cross-module dependencies.
 *
 * Wiring order:
 * 1. Shared infrastructure (AuthMiddleware, EmailService, EventBus, Typesense)
 * 2. Repositories for cross-dependent modules (job-board ↔ applications)
 * 3. Leaf modules (organizations, identity)
 * 4. Cross-module adapters (using repos/services from steps 2-3)
 * 5. Remaining modules (user-profile, notifications, job-board, applications, invitations)
 * 6. Auth dependency injection
 * 7. Shared workers (file-upload, domain-event, temp-file-cleanup)
 */
export function createCompositionRoot(): CompositionRoot {
  // ─── 1. Shared Infrastructure ───────────────────────────────────────

  const authMiddleware = new AuthMiddleware();
  const eventBus = new BullMqEventBus();
  const typesenseService = new TypesenseJobService();
  const typesenseUserProfileService = new TypesenseUserProfileService();

  // ─── 2. Concrete Repositories ───────────────────────────────────────
  // All repositories are created here and injected into modules.
  // This ensures no module instantiates its own concrete classes.

  const notificationsRepository = new NotificationsRepository();
  const jobBoardRepository = new JobBoardRepository();
  const jobInsightsRepository = new JobInsightsRepository();
  const applicationsRepository = new ApplicationsRepository();

  // EmailService depends on email preferences — satisfied by NotificationsRepository
  const emailService = new EmailService(notificationsRepository);

  // ─── 3. Leaf Modules ────────────────────────────────────────────────

  const organizations = createOrganizationsModule();
  const identity = createIdentityModule({ emailService, eventBus });

  // ─── 4. Cross-Module Adapters ───────────────────────────────────────

  // Organizations → other modules
  const orgsToProfileAdapter = new OrganizationsToProfileAdapter(
    organizations.repository,
    organizations.service,
  );
  const orgsToJobBoardAdapter = new OrganizationsToJobBoardAdapter(
    organizations.repository,
  );
  const orgsToApplicationsAdapter = new OrganizationsToApplicationsAdapter(
    organizations.repository,
  );
  const orgsToInvitationsAdapter = new OrganizationsToInvitationsAdapter(
    organizations.repository,
  );

  // Identity → other modules
  const identityToNotificationsAdapter = new IdentityToNotificationsAdapter(
    identity.repository,
  );
  const identityToApplicationsAdapter = new IdentityToApplicationsAdapter(
    identity.repository,
  );
  const identityToInvitationsAdapter = new IdentityToInvitationsAdapter(
    identity.repository,
  );
  const identityToJobBoardAdapter = new IdentityToJobBoardAdapter(
    identity.repository,
  );

  // Job-board ↔ Applications (circular — using pre-created repositories)
  const applicationsToJobBoardAdapter = new ApplicationsToJobBoardAdapter(
    applicationsRepository,
  );
  const jobBoardToApplicationsAdapter = new JobBoardToApplicationsAdapter(
    jobBoardRepository,
  );

  // Shared worker adapters
  const fileMetadataUpdateAdapter = new FileMetadataUpdateAdapter();
  const jobBoardToSharedInsightsAdapter = new JobBoardToSharedInsightsAdapter(
    jobInsightsRepository,
  );

  // ─── 5. Remaining Modules ──────────────────────────────────────────

  const userProfile = createUserProfileModule({
    orgRoleQuery: orgsToProfileAdapter,
    userOrgsQuery: orgsToProfileAdapter,
    typesenseUserProfileService,
  });

  // Profile → Job-board (saved jobs enrichment)
  const profileToJobBoardAdapter = new ProfileToJobBoardAdapter(
    userProfile.repository,
  );

  const notifications = createNotificationsModule({
    emailService,
    userActivityQuery: identityToNotificationsAdapter,
    typesenseService,
    notificationsRepository,
  });

  const jobBoard = createJobBoardModule({
    typesenseService,
    applicationStatusQuery: applicationsToJobBoardAdapter,
    savedJobsStatusQuery: profileToJobBoardAdapter,
    orgMembershipForJob: orgsToJobBoardAdapter,
    userContactQuery: identityToJobBoardAdapter,
    jobBoardRepository,
    jobInsightsRepository,
  });

  const applications = createApplicationsModule({
    jobDetailsQuery: jobBoardToApplicationsAdapter,
    orgMembershipQuery: orgsToApplicationsAdapter,
    applicantQuery: identityToApplicationsAdapter,
    eventBus,
    applicationsRepository,
  });

  const invitations = createInvitationsModule({
    orgMembership: orgsToInvitationsAdapter,
    userEmailQuery: identityToInvitationsAdapter,
    emailService,
  });

  // ─── 6. Auth Dependency Injection ──────────────────────────────────
  // Inject dependencies into the auth module (Better-Auth hooks)

  setAuthDependencies({
    notificationsService: notifications.service,
    profileService: userProfile.service,
  });

  // ─── 7. Shared Workers ─────────────────────────────────────────────

  const fileUploadWorker = createFileUploadWorker({
    fileMetadataUpdate: fileMetadataUpdateAdapter,
  });
  const domainEventWorker = createDomainEventWorker({
    applicationInsights: jobBoardToSharedInsightsAdapter,
    notificationsRepository: notifications.repository,
  });
  const tempFileCleanupWorker = createTempFileCleanupWorker();

  // Collect all module and shared workers
  const allWorkers: ModuleWorkers[] = [
    jobBoard.workers,
    userProfile.workers,
    notifications.workers,
    invitations.workers,
    fileUploadWorker,
    domainEventWorker,
    tempFileCleanupWorker,
  ];

  // ─── Return All Wired Modules ──────────────────────────────────────

  return {
    authenticate: authMiddleware.authenticate,

    // Modules (controller + guards)
    identity,
    userProfile,
    notifications,
    jobBoard,
    applications,
    organizations,
    invitations,

    // Worker orchestrator
    workers: {
      initializeAll() {
        for (const w of allWorkers) {
          w.initialize();
        }
        logger.info("All workers initialized");
      },
      async scheduleAllJobs() {
        const results = await Promise.allSettled(
          allWorkers.map((w) => w.scheduleJobs()),
        );
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          for (const f of failed) {
            logger.warn("Failed to schedule a background job", {
              error: f.reason?.message ?? "Unknown error",
            });
          }
        } else {
          logger.info("Background jobs scheduled");
        }
      },
    },
  };
}
