import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { createAuthMiddleware, getOAuthState, APIError } from "better-auth/api";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";

import { db } from "@shared/db/connection";
import { env, isProduction, isTest } from "@shared/config/env";

import type { NotificationsServicePort } from "@/modules/notifications";
import { BetterAuthSuccessResponseSchema } from "@/validations/auth.validation";
import logger from "@shared/logger";
import {
  queueService,
  QUEUE_NAMES,
} from "@shared/infrastructure/queue.service";
import { ProfileServicePort } from "@/modules/user-profile";
import type { IdentityServicePort } from "@/modules/identity";
import type { EventBusPort } from "@shared/events";
import { sendResetPassword } from "@/utils/auth/hooks/sendResetPassword";
import { sendVerificationEmail } from "@/utils/auth/hooks/sendVerificationEmail";
import { sendDeleteAccountVerification } from "@/utils/auth/hooks/sendDeleteAccountVerification";
import { runBeforeDeleteAccount } from "@/utils/auth/hooks/beforeDeleteAccount";
import { runAfterDeleteAccount } from "@/utils/auth/hooks/afterDeleteAccount";
import { getPostAuthRedirectUrl } from "@/utils/auth/post-auth-redirect";
import { auditService } from "@shared/audit";
import { authSigninTotal, authSignupTotal } from "@shared/metrics";

// ─── Setter-Injected Dependencies ────────────────────────────────────
// These are set by the central composition root at startup, before
// the server starts listening. The Better-Auth hooks read from these
// module-level variables via closures.

let notificationsService: NotificationsServicePort | null = null;
let profileService: ProfileServicePort | null = null;
let identityService: IdentityServicePort | null = null;
let eventBus: EventBusPort | null = null;

/**
 * Injects dependencies into the auth module. Must be called by the
 * composition root before the server starts accepting requests.
 */
export function setAuthDependencies(deps: {
  notificationsService: NotificationsServicePort;
  profileService: ProfileServicePort;
  identityService: IdentityServicePort;
  eventBus: EventBusPort;
}) {
  notificationsService = deps.notificationsService;
  profileService = deps.profileService;
  identityService = deps.identityService;
  eventBus = deps.eventBus;
}

/** Exposed for integration tests of auth hooks that need the wired identity service. */
export function getAuthIdentityService(): IdentityServicePort {
  if (!identityService) {
    throw new Error("Identity service not initialized");
  }
  return identityService;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
  }),
  rateLimit: {
    enabled: isProduction,
    window: 60, // 60 seconds
    max: 100, // limit each IP to 100 requests per windowMs
  },
  trustedOrigins: [env.FRONTEND_URL],
  baseURL: env.SERVER_URL,
  basePath: "/api/auth",
  session: {
    cookieCache: {
      enabled: !isTest,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: isProduction,
    resetPasswordTokenExpiresIn: 1800, // 30 minutes
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: sendResetPassword,
  },
  emailVerification: {
    sendOnSignUp: isProduction,
    autoSignInAfterVerification: true,
    sendVerificationEmail: sendVerificationEmail,
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    linkedin: {
      clientId: env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET,
    },
  },
  user: {
    deleteUser: {
      enabled: !isTest,
      sendDeleteAccountVerification: sendDeleteAccountVerification,
      beforeDelete: async (user) => {
        if (!identityService) {
          throw new APIError("INTERNAL_SERVER_ERROR", {
            message: "Identity service not initialized",
          });
        }
        await runBeforeDeleteAccount(user, { identityService });
      },
      afterDelete: async (user) => {
        if (!eventBus) {
          logger.error(
            { userId: user.id },
            "afterDelete fired before event bus was initialized — cleanup skipped",
          );
          return;
        }
        await runAfterDeleteAccount(user, { eventBus });
      },
    },
    fields: {
      name: "fullName",
    },
    additionalFields: {
      status: {
        type: "string",
        required: true,
        defaultValue: "active",
        input: false,
        validator: {
          input: z.enum(["active", "deactivated", "deleted"]),
        },
      },
      deletedAt: { type: "date", required: false, input: false },
      lastLoginAt: { type: "date", required: false, input: false },
      intent: {
        type: "string",
        required: true,
        defaultValue: "seeker",
        input: false,
        validator: {
          input: z.enum(["seeker", "employer"]),
        },
      },
      onboardingStatus: {
        type: "string",
        required: true,
        defaultValue: "pending",
        input: false,
        validator: {
          input: z.enum(["completed", "pending"]),
        },
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (_user, ctx) => {
          if (ctx?.path === "/sign-up/email") {
            const requestedIntent = (
              ctx.body as { intent?: unknown } | undefined
            )?.intent;
            if (
              requestedIntent !== undefined &&
              requestedIntent !== "seeker" &&
              requestedIntent !== "employer"
            ) {
              throw new APIError("BAD_REQUEST", {
                message: "Invalid registration intent",
              });
            }
            return { data: { intent: requestedIntent ?? "seeker" } };
          }

          if (ctx?.path === "/callback/:id") {
            // OAuth callbacks are redirects, so the normal signup response hook
            // cannot assign intent after the user has already been created.
            const oauthState = await getOAuthState();
            return {
              data: {
                intent:
                  oauthState?.intent === "employer" ? "employer" : "seeker",
              },
            };
          }
          return;
        },
      },
    },
  },
  advanced: {
    database: {
      useNumberId: true,
    },
    defaultCookieAttributes: {
      domain: isProduction ? ".getinvolved.team" : undefined,
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secure: isProduction,
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        return;
      }

      const email = ctx.body?.email;
      if (!email) {
        return;
      }

      // Check user status before allowing sign-in
      type InferredUser = typeof auth.$Infer.Session;
      const obj = await ctx.context.internalAdapter.findUserByEmail(email);
      const user = obj?.user as InferredUser["user"] | undefined;

      // Disallow sign-in for non-active users
      if (user && user.status !== "active") {
        const message =
          user.status === "deleted"
            ? "Account has been deleted"
            : "Account is not active";

        throw new APIError("UNAUTHORIZED", {
          message,
        });
      }
    }),

    after: createAuthMiddleware(async (ctx) => {
      // auth.signin.failed — emit when sign-in/email returned an APIError.
      if (
        ctx.path === "/sign-in/email" &&
        ctx.context.returned instanceof APIError
      ) {
        const attemptedEmail = (ctx.body as { email?: string } | undefined)
          ?.email;
        auditService.emit({
          name: "auth.signin.failed",
          actor: buildAuthActor(ctx),
          resource: { type: "user" },
          action: "signed in",
          outcome: "failure",
          failureReason: ctx.context.returned.message,
          metadata: attemptedEmail ? { attemptedEmail } : undefined,
        });
        authSigninTotal.add(1, {
          method: "email",
          outcome: "failure",
          provider: "email",
        });
      }

      // Debug: log get-session outcomes to diagnose middleware redirect issue
      if (ctx.path === "/get-session") {
        const returned = ctx.context.returned;
        if (returned instanceof APIError) {
          logger.warn(
            {
              path: ctx.path,
              errorCode: returned.statusCode,
              errorMessage: returned.message,
              userAgent: ctx.headers?.get("user-agent"),
              hasCookie: !!ctx.headers?.get("cookie"),
            },
            "get-session failed",
          );
        }
        return;
      }
      if (ctx.path === "/sign-up/email") {
        return await handleEmailRegistration(ctx);
      } else if (ctx.path === "/callback/:id") {
        return await handleOAuthRegistration(ctx);
      } else if (ctx.path === "/sign-in/email") {
        return await postUserAuthenticationActions(ctx);
      } else if (ctx.path === "/change-password") {
        await changePasswordAction(ctx);
      } else if (
        ctx.path === "/reset-password" &&
        ctx.request?.method === "POST"
      ) {
        await resetPasswordAction(ctx);
      } else if (ctx.path === "/sign-out") {
        emitSignOutAudit(ctx);
      }
      return;
    }),
  },
  plugins: [openAPI()],
});

type BetterAuthMiddlewareContext = Parameters<
  Parameters<typeof createAuthMiddleware>[0]
>[0];

/**
 * Extracts the successful user result from a Better-Auth after-hook context.
 * Returns null if the response is an error, missing, or lacks user data
 * (e.g. OAuth redirect responses that only contain a URL).
 */
function getSuccessResult(
  ctx: BetterAuthMiddlewareContext,
): BetterAuthSuccessResponseSchema | null {
  const returned = ctx.context.returned;
  if (!returned || returned instanceof APIError) {
    return null;
  }

  const result = returned as Record<string, unknown>;
  if (!result.user || typeof result.user !== "object") {
    return null;
  }

  return returned as BetterAuthSuccessResponseSchema;
}

function buildAuthActor(
  ctx: BetterAuthMiddlewareContext,
  userId?: string | number,
) {
  const headers = ctx.headers;
  const ip =
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  const userAgent = headers?.get("user-agent") || undefined;
  return { id: userId, ip, userAgent };
}

function enrichResponse(
  userResult: BetterAuthSuccessResponseSchema,
  intent: "seeker" | "employer",
  onboardingStatus: "pending" | "completed",
) {
  return {
    ...userResult,
    user: {
      ...userResult.user,
      intent,
      redirectUrl: getPostAuthRedirectUrl(intent, onboardingStatus),
    },
  };
}

async function ensureAuthResources(
  userId: number,
  intent: "seeker" | "employer",
  source: "email_signup" | "email_signin" | "oauth_callback",
) {
  const run = async (
    step: string,
    action: () => Promise<{ isFailure: boolean; error?: unknown }> | undefined,
  ) => {
    try {
      const result = await action();
      if (result?.isFailure) {
        logger.error(
          { err: result.error, step, source, userId },
          "auth.resource_initialization_failed",
        );
      }
    } catch (error) {
      logger.error(
        { err: error, step, source, userId },
        "auth.resource_initialization_failed",
      );
    }
  };

  await Promise.all([
    run("initializeUserIntent", () =>
      profileService?.initializeUserIntent(userId, intent),
    ),
    run("createDefaultEmailPreferences", () =>
      notificationsService?.createDefaultEmailPreferences(userId),
    ),
  ]);

  if (!profileService) {
    logger.error({ source, userId }, "auth.profile_service_not_initialized");
    return;
  }

  try {
    const existingUser = await profileService.getUserById(userId);
    if (existingUser.isFailure) {
      logger.error(
        { err: existingUser.error, source, userId },
        "auth.profile_lookup_failed",
      );
    } else if (!existingUser.value.profile) {
      await run("createUserProfile", () =>
        profileService?.createUserProfile(userId, { country: null }),
      );
    }
  } catch (error) {
    logger.error({ err: error, source, userId }, "auth.profile_lookup_failed");
  }
}

async function handleEmailRegistration(ctx: BetterAuthMiddlewareContext) {
  const userResult = getSuccessResult(ctx);
  if (!userResult) return;

  const userId = Number(userResult.user.id);
  const userRecord = userResult.user as Record<string, unknown>;
  const intent = userRecord.intent === "employer" ? "employer" : "seeker";

  try {
    await ensureAuthResources(userId, intent, "email_signup");

    auditService.emit({
      name: "auth.signup",
      actor: buildAuthActor(ctx, userId),
      resource: { type: "user", id: userId },
      action: "signed up",
      outcome: "success",
      metadata: { method: "email", intent },
    });
    authSignupTotal.add(1, { method: "email", outcome: "success" });

    return enrichResponse(userResult, intent, "pending");
  } catch (error) {
    logger.error(error, "Error during email registration post-actions");
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Error during user sign-up process",
    });
  }
}

async function handleOAuthRegistration(ctx: BetterAuthMiddlewareContext) {
  // Better Auth returns a redirect response for OAuth callbacks. The newly
  // issued session, including its user, is available on the auth context.
  const user = ctx.context.newSession?.user;
  if (!user || ctx.context.returned instanceof APIError) return;

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId)) return;

  try {
    const userRecord = user as Record<string, unknown>;
    const intent = userRecord.intent === "employer" ? "employer" : "seeker";
    await ensureAuthResources(userId, intent, "oauth_callback");

    // OAuth callback fires on both first-time link and every subsequent
    // sign-in. We emit auth.signin.success here; a dedicated
    // auth.oauth.linked event would require a first-time-link detection
    // path (e.g. hooking Better-Auth's /link-social route), which is not
    // wired in v1.
    auditService.emit({
      name: "auth.signin.success",
      actor: buildAuthActor(ctx, userId),
      resource: { type: "user", id: userId },
      action: "signed in",
      outcome: "success",
      metadata: { method: "oauth" },
    });
    const provider =
      (ctx.params as { id?: string } | undefined)?.id ?? "unknown";
    authSigninTotal.add(1, { method: "oauth", outcome: "success", provider });

    // Preserve Better Auth's redirect response and Set-Cookie headers.
    return;
  } catch (error) {
    logger.error(error, "Error during OAuth registration post-actions");
    return;
  }
}

async function postUserAuthenticationActions(ctx: BetterAuthMiddlewareContext) {
  if (ctx.context.returned instanceof APIError) {
    return;
  }
  // intent is now a user additionalField — no DB query needed
  const returned = ctx.context.returned as BetterAuthSuccessResponseSchema;
  const userId = returned.user.id;
  if (!userId) {
    return;
  }

  const userRecord = returned.user as Record<string, unknown>;
  const intent = userRecord.intent === "employer" ? "employer" : "seeker";
  const onboardingStatus =
    userRecord.onboardingStatus === "completed" ? "completed" : "pending";

  const numericUserId = Number(userId);
  if (Number.isSafeInteger(numericUserId)) {
    // A previous signup may have created the auth user while a profile or
    // onboarding post-action failed. Sign-in repairs missing resources.
    await ensureAuthResources(numericUserId, intent, "email_signin");
  }

  auditService.emit({
    name: "auth.signin.success",
    actor: buildAuthActor(ctx, userId),
    resource: { type: "user", id: userId },
    action: "signed in",
    outcome: "success",
    metadata: { method: "email" },
  });
  authSigninTotal.add(1, {
    method: "email",
    outcome: "success",
    provider: "email",
  });

  return enrichResponse(returned, intent, onboardingStatus);
}

async function changePasswordAction(ctx: BetterAuthMiddlewareContext) {
  // if sign-in not successful, do nothing
  if (ctx.context.returned instanceof APIError) {
    return;
  }

  const returned = ctx.context.returned as BetterAuthSuccessResponseSchema;
  if (!returned?.user) {
    return;
  }
  try {
    await queueService.addJob(
      QUEUE_NAMES.EMAIL_QUEUE,
      "sendPasswordChangedEmail",
      {
        userId: Number(returned.user.id),
        email: returned.user.email,
        fullName: returned.user.name,
      },
    );
    auditService.emit({
      name: "auth.password.changed",
      actor: buildAuthActor(ctx, returned.user.id),
      resource: { type: "user", id: returned.user.id },
      action: "changed password",
      outcome: "success",
      metadata: { flow: "change-password" },
    });
    return;
  } catch (error) {
    logger.error(error, "Failed to queue password changed email");
  }
}

async function resetPasswordAction(ctx: BetterAuthMiddlewareContext) {
  if (ctx.context.returned instanceof APIError) {
    return;
  }

  // After a successful password reset, notify the user via email
  const returned = ctx.context.returned as BetterAuthSuccessResponseSchema;
  if (!returned?.user) {
    return;
  }
  try {
    await queueService.addJob(
      QUEUE_NAMES.EMAIL_QUEUE,
      "sendPasswordChangedEmail",
      {
        userId: Number(returned.user.id),
        email: returned.user.email,
        fullName: returned.user.name,
      },
    );
    auditService.emit({
      name: "auth.password.changed",
      actor: buildAuthActor(ctx, returned.user.id),
      resource: { type: "user", id: returned.user.id },
      action: "changed password",
      outcome: "success",
      metadata: { flow: "reset-password" },
    });
    return;
  } catch (error) {
    logger.error(error, "Failed to queue password changed email after reset");
    return;
  }
}

function emitSignOutAudit(ctx: BetterAuthMiddlewareContext) {
  if (ctx.context.returned instanceof APIError) return;
  const session = ctx.context.session as
    | { user?: { id?: string | number } }
    | undefined;
  const userId = session?.user?.id;
  auditService.emit({
    name: "auth.signout",
    actor: buildAuthActor(ctx, userId),
    resource: { type: "user", id: userId },
    action: "signed out",
    outcome: "success",
  });
}
