import { Router } from "express";
import { CompositionRoot, createCompositionRoot } from "@/composition-root";
import { createUserRoutes } from "./user.routes";
import { createJobRoutes } from "./job.routes";
import { createOrganizationRoutes } from "./organization.routes";
import { createInvitationRoutes } from "./invitation.routes";

// ─── Application Composition Root ───────────────────────────────────
//
// All dependency wiring happens here — modules, adapters, infrastructure.
// Each top-level route factory receives pre-wired modules.

const root: CompositionRoot = createCompositionRoot();
const router = Router();

// Mount route modules
// router.use("/auth", authRoutes);
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

export default router;
