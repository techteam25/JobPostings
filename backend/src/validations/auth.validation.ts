import { z } from "@/swagger/registry";

const REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

const registerSchema = z
  .object({
    email: z
      .email("Invalid email format")
      .transform((val) => val.trim())
      .openapi({
        example: "user@example.com",
      }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        REGEX,
        "Password must contain uppercase, lowercase, number, and special character",
      )
      .transform((val) => val.trim())
      .openapi({
        example: "StrongP@ssw0rd!",
      }),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100)
      .nonempty()
      .openapi({
        example: "John",
      }),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100)
      .nonempty()
      .openapi({
        example: "Doe",
      }),
    role: z.enum(["user", "employer", "admin"]).default("user").openapi({
      example: "user",
    }),
    organizationId: z.number().int().positive().optional().openapi({
      example: 123,
    }),
  })
  .openapi("RegisterUser");

const loginSchema = z
  .object({
    email: z.email("Invalid email format").nonempty().openapi({
      example: "user@example.com",
    }),
    password: z.string().min(1, "Password is required").nonempty().openapi({
      example: "StrongP@ssw0rd!",
    }),
  })
  .openapi("UserLogin");

const refreshTokenSchema = z
  .object({
    refreshToken: z.string().nonempty().openapi({
      example: "some-refresh-token",
    }),
  })
  .openapi("RefreshTokenRequest");

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required")
      .nonempty()
      .openapi({
        example: "CurrentP@ssw0rd!",
      }),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        REGEX,
        "Password must contain uppercase, lowercase, number, and special character",
      )
      .nonempty()
      .openapi({
        example: "NewStrongP@ssw0rd!",
      }),
  })
  .openapi("ChangePassword");

const profileIdParamSchema = z
  .object({
    profileId: z.coerce.number("profileId is required").openapi({
      example: 1,
    }),
  })
  .openapi("ProfileParam");

export const registerUserSchema = z.object({
  body: registerSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const userRefreshTokenSchema = z.object({
  body: refreshTokenSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const userLoginSchema = z.object({
  body: loginSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const changeUserPasswordSchema = z.object({
  body: changePasswordSchema,
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export type RegisterUserSchema = z.infer<typeof registerUserSchema>;
export type UserLoginSchema = z.infer<typeof userLoginSchema>;
export type ChangeUserPasswordSchema = z.infer<typeof changeUserPasswordSchema>;
export type UserRefreshTokenSchema = z.infer<typeof userRefreshTokenSchema>;
