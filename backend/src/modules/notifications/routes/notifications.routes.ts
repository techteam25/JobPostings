import { Router } from "express";
import { NotificationsController } from "@/modules/notifications";
import { NotificationsRepository } from "@/modules/notifications";
import { NotificationsService } from "@/modules/notifications";
import { ProfileRepository } from "@/modules/user-profile/repositories/profile.repository";
import { ProfileService } from "@/modules/user-profile/services/profile.service";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { EmailService } from "@shared/infrastructure/email.service";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import validate from "@/middleware/validation.middleware";
import {
  getUserEmailPreferencesSchema,
  updateUserEmailPreferencesSchema,
} from "@/validations/user.validation";
import {
  createJobAlertSchema,
  getUserJobAlertsQuerySchema,
  getJobAlertSchema,
  updateJobAlertSchema,
  deleteJobAlertSchema,
  togglePauseJobAlertSchema,
} from "@/validations/jobAlerts.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";

export function createNotificationsRoutes(): Router {
  const router = Router();

  const notificationsRepository = new NotificationsRepository();
  const profileRepository = new ProfileRepository();
  const organizationRepository = new OrganizationRepository();
  const emailService = new EmailService();
  const profileService = new ProfileService(
    profileRepository,
    organizationRepository,
  );
  const notificationsService = new NotificationsService(
    notificationsRepository,
    emailService,
    async (userId: number) => {
      const result = await profileService.getUserById(userId);
      if (result.isSuccess && result.value) {
        return {
          email: result.value.email,
          fullName: result.value.fullName,
        };
      }
      return null;
    },
  );
  const notificationsController = new NotificationsController(
    notificationsService,
    profileService,
  );
  const authMiddleware = new AuthMiddleware();

  // Email preferences routes (authenticated via parent router)

  // GET /users/me/email-preferences
  router.get(
    "/me/email-preferences",
    validate(getUserEmailPreferencesSchema),
    cacheMiddleware({ ttl: 300 }),
    notificationsController.getEmailPreferences,
  );

  // PUT /users/me/email-preferences
  router.put(
    "/me/email-preferences",
    validate(updateUserEmailPreferencesSchema),
    invalidateCacheMiddleware(() => "users/me/email-preferences"),
    notificationsController.updateEmailPreferences,
  );

  // POST /users/me/email-preferences/unsubscribe/:token
  router.post(
    "/me/email-preferences/unsubscribe/:token",
    invalidateCacheMiddleware(() => "users/me/email-preferences"),
    notificationsController.unsubscribeByToken,
  );

  // POST /users/me/email-preferences/resubscribe
  router.post(
    "/me/email-preferences/resubscribe",
    invalidateCacheMiddleware(() => "users/me/email-preferences"),
    notificationsController.resubscribeEmailNotifications,
  );

  // GET /users/me/email-preferences/unsubscribe/:token/info (public endpoint)
  router.get(
    "/me/email-preferences/unsubscribe/:token/info",
    notificationsController.getUnsubscribeLandingPageData,
  );

  // POST /users/me/email-preferences/unsubscribe-context
  router.post(
    "/me/email-preferences/unsubscribe-context",
    invalidateCacheMiddleware(() => "users/me/email-preferences"),
    authMiddleware.authenticate,
    notificationsController.unsubscribeByContext,
  );

  // POST /users/me/email-preferences/resubscribe-context
  router.post(
    "/me/email-preferences/resubscribe-context",
    authMiddleware.authenticate,
    notificationsController.resubscribeByContext,
  );

  // PATCH /users/me/email-preferences/granular
  router.patch(
    "/me/email-preferences/granular",
    invalidateCacheMiddleware(() => "users/me/email-preferences"),
    authMiddleware.authenticate,
    notificationsController.updateGranularEmailPreference,
  );

  // Job alerts routes

  // POST /users/me/job-alerts
  router.post(
    "/me/job-alerts",
    authMiddleware.requireUserRole,
    validate(createJobAlertSchema),
    invalidateCacheMiddleware(() => "users/me/job-alerts"),
    notificationsController.createJobAlert,
  );

  // GET /users/me/job-alerts
  router.get(
    "/me/job-alerts",
    authMiddleware.requireUserRole,
    validate(getUserJobAlertsQuerySchema),
    cacheMiddleware({ ttl: 300 }),
    notificationsController.getUserJobAlerts,
  );

  // GET /users/me/job-alerts/:id
  router.get(
    "/me/job-alerts/:id",
    authMiddleware.requireUserRole,
    validate(getJobAlertSchema),
    cacheMiddleware({ ttl: 300 }),
    notificationsController.getJobAlertById,
  );

  // PUT /users/me/job-alerts/:id
  router.put(
    "/me/job-alerts/:id",
    authMiddleware.requireUserRole,
    validate(updateJobAlertSchema),
    invalidateCacheMiddleware(() => "users/me/job-alerts"),
    notificationsController.updateJobAlert,
  );

  // PATCH /users/me/job-alerts/:id/pause
  router.patch(
    "/me/job-alerts/:id/pause",
    authMiddleware.requireUserRole,
    validate(togglePauseJobAlertSchema),
    invalidateCacheMiddleware(() => "users/me/job-alerts"),
    notificationsController.togglePauseJobAlert,
  );

  // DELETE /users/me/job-alerts/:id
  router.delete(
    "/me/job-alerts/:id",
    authMiddleware.requireUserRole,
    validate(deleteJobAlertSchema),
    invalidateCacheMiddleware(() => "users/me/job-alerts"),
    notificationsController.deleteJobAlert,
  );

  return router;
}
