import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import { BetterAuthUser } from "@/utils/auth/types";

export interface SendVerificationEmailRequest {
  user: BetterAuthUser;
  token: string;
}

export const sendVerificationEmail = async ({
  user,
  token,
}: SendVerificationEmailRequest) => {
  await queueService.addJob(QUEUE_NAMES.EMAIL_QUEUE, "sendEmailVerification", {
    userId: Number(user.id),
    email: user.email,
    fullName: user.name,
    token,
  });
};
