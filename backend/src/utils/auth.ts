import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";

import { db } from "@/db/connection";
import { env, isProduction } from "@/config/env";

import { EmailService } from "@/services/email.service";
import { BetterAuthSuccessResponseSchema } from "@/validations/auth.validation";
import { userOnBoarding } from "@/db/schema";
import { withDbErrorHandling } from "@/db/dbErrorHandler";
import logger from "@/logger";

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
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: isProduction,
  },
  emailVerification: {
    sendOnSignUp: isProduction,
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
              intent: body.intent,
            };
          } catch (error) {
            logger.error(error, "Error inserting into userOnBoarding");
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Error during user sign-up process",
            });
          }
        }

        const userId = ctx.context.session?.user.id;
        if (userId) {
          await ctx.context.internalAdapter.updateUser(userId, {
            lastLoginAt: new Date(),
          });
        }
      }
      return;
    }),
  },
  plugins: [openAPI()],
});
