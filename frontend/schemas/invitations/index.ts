import { z } from "zod";

export const assignableMemberRoleSchema = z.enum(
  ["admin", "recruiter", "member"],
  {
    error: "Please select a role",
  },
);

export const sendInvitationSchema = z.object({
  email: z.email("Invalid email address"),
  role: assignableMemberRoleSchema,
});

export const changeMemberRoleSchema = z.object({
  role: assignableMemberRoleSchema,
});

export type AssignableMemberRole = z.infer<typeof assignableMemberRoleSchema>;
export type SendInvitationFormData = z.infer<typeof sendInvitationSchema>;
export type ChangeMemberRoleFormData = z.infer<typeof changeMemberRoleSchema>;
