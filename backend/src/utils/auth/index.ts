import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";

import { db } from "@shared/db/connection";
import { env, isProduction } from "@shared/config/env";

import type { NotificationsServicePort } from "@/modules/notifications";
import { BetterAuthSuccessResponseSchema } from "@/validations/auth.validation";
import { userOnBoarding } from "@/db/schema";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import logger from "@shared/logger";
import { eq } from "drizzle-orm";
import {
  queueService,
  QUEUE_NAMES,
} from "@shared/infrastructure/queue.service";
import { ProfileServicePort } from "@/modules/user-profile";
import { sendResetPassword } from "@/utils/auth/hooks/sendResetPassword";
import { sendVerificationEmail } from "@/utils/auth/hooks/sendVerificationEmail";
import { sendDeleteAccountVerification } from "@/utils/auth/hooks/sendDeleteAccountVerification";

// ─── Setter-Injected Dependencies ────────────────────────────────────
// These are set by the central composition root at startup, before
// the server starts listening. The Better-Auth hooks read from these
// module-level variables via closures.

let notificationsService: NotificationsServicePort | null = null;
let profileService: ProfileServicePort | null = null;

/**
 * Injects dependencies into the auth module. Must be called by the
 * composition root before the server starts accepting requests.
 */
export function setAuthDependencies(deps: {
  notificationsService: NotificationsServicePort;
  profileService: ProfileServicePort;
}) {
  notificationsService = deps.notificationsService;
  profileService = deps.profileService;
}

type UserRegistrationPayload = {
  name: string;
  email: string;
  password: string;
  intent: "seeker" | "employer";
};

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
  baseURL: isProduction ? env.SERVER_URL : undefined,
  basePath: "/api/auth",
  session: {
    cookieCache: {
      enabled: isProduction,
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
      enabled: isProduction,
      sendDeleteAccountVerification: sendDeleteAccountVerification,
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
      } else if (ctx.path === "/sign-in/social") {
        return await handleOAuthRegistration(ctx);
      } else if (ctx.path === "/sign-in/email") {
        await postUserAuthenticationActions(ctx);
      } else if (ctx.path === "/change-password") {
        await changePasswordAction(ctx);
      } else if (
        ctx.path === "/reset-password" &&
        ctx.request?.method === "POST"
      ) {
        await resetPasswordAction(ctx);
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
 * Returns null if the response is an error or missing.
 */
function getSuccessResult(
  ctx: BetterAuthMiddlewareContext,
): BetterAuthSuccessResponseSchema | null {
  if (!ctx.context.returned || ctx.context.returned instanceof APIError) {
    return null;
  }
  return ctx.context.returned as BetterAuthSuccessResponseSchema;
}

function enrichResponse(
  userResult: BetterAuthSuccessResponseSchema,
  intent: "seeker" | "employer",
) {
  return {
    ...userResult,
    user: {
      ...userResult.user,
      intent,
      redirectUrl: intent === "employer" ? "/employer/onboarding" : "/",
    },
  };
}

async function handleEmailRegistration(ctx: BetterAuthMiddlewareContext) {
  const userResult = getSuccessResult(ctx);
  if (!userResult) return;

  const body = ctx.body as UserRegistrationPayload;
  const userId = Number(userResult.user.id);

  try {
    await withDbErrorHandling(async () =>
      db.insert(userOnBoarding).values({
        userId,
        intent: body.intent,
        status: "pending",
      }),
    );

    await Promise.allSettled([
      notificationsService?.createDefaultEmailPreferences(userId),
      profileService?.createUserProfile(userId, { country: null }),
    ]);

    return enrichResponse(userResult, body.intent);
  } catch (error) {
    logger.error(error, "Error during email registration post-actions");
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Error during user sign-up process",
    });
  }
}

async function handleOAuthRegistration(ctx: BetterAuthMiddlewareContext) {
  const userResult = getSuccessResult(ctx);
  if (!userResult) return;

  const userId = Number(userResult.user.id);

  try {
    // Check if this user has already been through registration
    const [existing] = await db
      .select()
      .from(userOnBoarding)
      .where(eq(userOnBoarding.userId, userId))
      .limit(1);

    if (existing) {
      // Repeat sign-in — skip resource creation, return enriched response
      return enrichResponse(userResult, existing.intent);
    }

    // First-time OAuth sign-in — create onboarding + profile + email prefs
    await withDbErrorHandling(async () =>
      db.insert(userOnBoarding).values({
        userId,
        intent: "seeker",
        status: "pending",
      }),
    );

    await Promise.allSettled([
      notificationsService?.createDefaultEmailPreferences(userId),
      profileService?.createUserProfile(userId, { country: null }),
    ]);

    return enrichResponse(userResult, "seeker");
  } catch (error) {
    logger.error(error, "Error during OAuth registration post-actions");
    return;
  }
}

async function postUserAuthenticationActions(ctx: BetterAuthMiddlewareContext) {
  if (ctx.context.returned instanceof APIError) {
    return;
  }
  // if successful, return response with user amended to include intent field and redirectUrl
  const returned = ctx.context.returned as BetterAuthSuccessResponseSchema;
  const userId = returned.user.id;
  if (!userId) {
    return;
  }
  const [onboarding] = await db
    .select()
    .from(userOnBoarding)
    .where(eq(userOnBoarding.userId, Number(userId)))
    .limit(1);

  const intent = onboarding ? onboarding.intent : "seeker";
  const redirectUrl = intent === "employer" ? "/employer/organizations" : "/";

  return {
    ...returned,
    user: {
      ...returned.user,
      intent,
      redirectUrl,
    },
  };
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
    return;
  } catch (error) {
    logger.error(error, "Failed to queue password changed email after reset");
    return;
  }
}
