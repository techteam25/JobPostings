import { Router } from "express";
import type { CompositionRoot } from "@/composition-root";
import { createUserRoutes } from "./user.routes";
import { createJobRoutes } from "./job.routes";
import { createOrganizationRoutes } from "./organization.routes";
import { createInvitationRoutes } from "./invitation.routes";

/**
 * Creates the API router with pre-wired module dependencies.
 * The composition root is created once in app.ts and passed here.
 */
export function createApiRoutes(root: CompositionRoot) {
  const router = Router();

  router.use(
    "/users",
    createUserRoutes({
      authenticate: root.authenticate,
      identity: root.identity,
      userProfile: root.userProfile,
      notifications: root.notifications,
      organizations: root.organizations,
    }),
  );
  router.use(
    "/jobs",
    createJobRoutes({
      authenticate: root.authenticate,
      optionalAuthenticate: root.optionalAuthenticate,
      jobBoard: root.jobBoard,
      applications: root.applications,
      organizations: root.organizations,
      userProfile: root.userProfile,
    }),
  );
  router.use(
    "/organizations",
    createOrganizationRoutes({
      authenticate: root.authenticate,
      organizations: root.organizations,
      applications: root.applications,
      invitations: root.invitations,
    }),
  );
  router.use(
    "/invitations",
    createInvitationRoutes({
      authenticate: root.authenticate,
      invitations: root.invitations,
    }),
  );

  return router;
}
