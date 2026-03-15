import { AuthMiddleware } from "@/middleware/auth.middleware";
import { EmailService } from "@shared/infrastructure/email.service";
import { TypesenseService } from "@shared/infrastructure/typesense.service/typesense.service";
import { BullMqEventBus } from "@shared/events";

// Old facade repositories — still needed by JobBoardService until fully decoupled
import { UserRepository } from "@/repositories/user.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";

// Module composition roots
import { createOrganizationsModule } from "@/modules/organizations";
import { createIdentityModule } from "@/modules/identity";
import { createUserProfileModule } from "@/modules/user-profile";
import { createNotificationsModule } from "@/modules/notifications";
import { createJobBoardModule } from "@/modules/job-board";
import { createApplicationsModule } from "@/modules/applications";
import { createInvitationsModule } from "@/modules/invitations";

// Repositories created centrally for circular dependency resolution
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
  ApplicationsToJobBoardAdapter,
  JobBoardToApplicationsAdapter,
} from "@shared/adapters";

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
import type { EmailServicePort } from "@/ports/email-service.port";

/**
 * Public API of the composition root — only exposes controller + guards per module.
 * Internal details (repositories, services) are hidden from route consumers.
 */
export type CompositionRoot = {
  authenticate: RequestHandler;
  identity: Pick<IdentityModule, "controller" | "guards">;
  userProfile: Pick<UserProfileModule, "controller" | "guards">;
  notifications: Pick<NotificationsModule, "controller">;
  jobBoard: Pick<JobBoardModule, "controller" | "guards">;
  applications: Pick<ApplicationsModule, "controller" | "guards">;
  organizations: Pick<OrganizationsModule, "controller" | "guards">;
  invitations: Pick<InvitationsModule, "controller" | "guards">;
  emailService: EmailServicePort;
};

/**
 * Central composition root for the entire application.
 *
 * Creates all shared infrastructure, module instances, and cross-module adapters.
 * Each module receives its dependencies through constructor injection — no module
 * instantiates its own cross-module dependencies.
 *
 * Wiring order:
 * 1. Shared infrastructure (AuthMiddleware, EmailService, EventBus, Typesense)
 * 2. Repositories for cross-dependent modules (job-board ↔ applications)
 * 3. Leaf modules (organizations, identity)
 * 4. Cross-module adapters (using repos/services from steps 2-3)
 * 5. Remaining modules (user-profile, notifications, job-board, applications, invitations)
 * 6. Auth dependency injection
 */
export function createCompositionRoot(): CompositionRoot {
  // ─── 1. Shared Infrastructure ───────────────────────────────────────

  const authMiddleware = new AuthMiddleware();
  const userRepository = new UserRepository();
  const organizationRepository = new OrganizationRepository();
  const emailService = new EmailService(userRepository);
  const eventBus = new BullMqEventBus();
  const typesenseService = new TypesenseService();

  // ─── 2. Repositories for Circular Dependency Resolution ─────────────
  // job-board needs applicationStatusQuery (from applications repo)
  // applications needs jobDetailsQuery (from job-board repo)
  // Both adapters need the other's repository, so we create repos first.

  const jobBoardRepository = new JobBoardRepository();
  const jobInsightsRepository = new JobInsightsRepository();
  const applicationsRepository = new ApplicationsRepository();

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

  // Job-board ↔ Applications (circular — using pre-created repositories)
  const applicationsToJobBoardAdapter = new ApplicationsToJobBoardAdapter(
    applicationsRepository,
  );
  const jobBoardToApplicationsAdapter = new JobBoardToApplicationsAdapter(
    jobBoardRepository,
  );

  // ─── 5. Remaining Modules ──────────────────────────────────────────

  const userProfile = createUserProfileModule({
    orgRoleQuery: orgsToProfileAdapter,
    userOrgsQuery: orgsToProfileAdapter,
  });

  const notifications = createNotificationsModule({
    emailService,
    userActivityQuery: identityToNotificationsAdapter,
  });

  const jobBoard = createJobBoardModule({
    organizationRepository,
    userRepository,
    typesenseService,
    applicationStatusQuery: applicationsToJobBoardAdapter,
    orgMembershipForJob: orgsToJobBoardAdapter,
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
    emailService,
  });

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

    // Shared infrastructure (for route files that need it)
    emailService,
  };
}
