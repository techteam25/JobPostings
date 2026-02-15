import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";

import { db } from "@/db/connection";
import { env, isProduction } from "@/config/env";

import { EmailService } from "@/infrastructure/email.service";
import { BetterAuthSuccessResponseSchema } from "@/validations/auth.validation";
import { userOnBoarding } from "@/db/schema";
import { withDbErrorHandling } from "@/db/dbErrorHandler";
import logger from "@/logger";
import { eq } from "drizzle-orm";
const emailService = new EmailService();

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
  trustedOrigins: [env.FRONTEND_URL],
  baseURL: isProduction ? env.SERVER_URL : undefined,
  basePath: "/api/auth",
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      await emailService.sendEmailVerification(user.email, user.name, token);
    },
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
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url, token }) => {
        await emailService.sendDeleteAccountEmailVerification(
          user.email,
          user.name,
          url,
          token,
        );
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
        validator: { input: z.enum(["active", "deactivated", "deleted"]) },
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
      if (ctx.path === "/sign-up/email") {
        // check if response status is 200
        if (ctx.context.returned) {
          if (ctx.context.returned instanceof APIError) {
            return;
          }
          const userResult = ctx.context
            .returned as BetterAuthSuccessResponseSchema;
          const body = ctx.body as UserRegistrationPayload;

          try {
            await withDbErrorHandling(async () =>
              db.insert(userOnBoarding).values({
                userId: Number(userResult.user.id),
                intent: body.intent,
                status: "pending",
              }),
            );
            // Modify and return the response with added 'intent' property
            return {
              ...userResult,
              user: {
                ...userResult.user,
                intent: body.intent,
                redirectUrl:
                  body.intent === "employer" ? "/employer/onboarding" : "/",
              },
            };
          } catch (error) {
            logger.error(error, "Error inserting into userOnBoarding");
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Error during user sign-up process",
            });
          }
        }
      } else if (ctx.path === "/sign-in/email") {
        // if sign-in not successful, do nothing
        if (ctx.context.returned instanceof APIError) {
          return;
        }
        // if successful, return response with user amended to include intent field and redirectUrl
        const returned = ctx.context
          .returned as BetterAuthSuccessResponseSchema;
        const userId = returned.user.id;
        if (userId) {
          const [onboarding] = await db
            .select()
            .from(userOnBoarding)
            .where(eq(userOnBoarding.userId, Number(userId)))
            .limit(1);

          const intent = onboarding ? onboarding.intent : "seeker";
          const redirectUrl =
            intent === "employer" ? "/employer/organizations" : "/";

          return {
            ...returned,
            user: {
              ...returned.user,
              intent,
              redirectUrl,
            },
          };
        }
      }
      return;
    }),
  },
  plugins: [openAPI()],
});
