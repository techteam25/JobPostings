import { z } from "zod";

export const sendInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "recruiter", "member"], {
    error: "Please select a role",
  }),
});

export type SendInvitationFormData = z.infer<typeof sendInvitationSchema>;
