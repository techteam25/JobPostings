import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import jobRoutes from "./job.routes";
import organizationRoutes from "./organization.routes";

const router = Router();

// Mount route modules
// router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/jobs", jobRoutes);
router.use("/organizations", organizationRoutes);

export default router;
