import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";

import { db } from "@/db/connection";
import logger from "@/logger";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  // socialProviders: {
  //   google: {
  //     clientId: "client_id",
  //     clientSecret: "client_secret",
  //   },
  // },
  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async (
        {
          // Todo: implement sendDeleteAccountVerification
          user, // The user object
          url, // The auto-generated URL for deletion
          token, // The verification token  (can be used to generate custom URL)
        },
        request, // The original request object (optional)
      ) => {
        // Your email sending logic here
        // Example: sendEmail(data.user.email, "Verify Deletion", data.url);
        logger.info({ user, url, token });
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

      type InferredUser = typeof auth.$Infer.Session;
      const obj = await ctx.context.internalAdapter.findUserByEmail(email);
      const user = obj?.user as InferredUser["user"] | undefined;

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
  },
});
