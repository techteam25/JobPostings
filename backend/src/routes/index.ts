import { Router } from "express";
import userRoutes from "./user.routes";
import jobRoutes from "./job.routes";
import organizationRoutes from "./organization.routes";
import invitationRoutes from "./invitation.routes";

const router = Router();

// Mount route modules
// router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/jobs", jobRoutes);
router.use("/organizations", organizationRoutes);
router.use("/invitations", invitationRoutes);

export default router;
