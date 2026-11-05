import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import { BetterAuthUser } from "@/utils/auth/types";

export interface SendResetPasswordRequest {
  user: BetterAuthUser;
  url: string;
}

export const sendResetPassword = async ({
  user,
  url,
}: SendResetPasswordRequest) => {
  await queueService.addJob(QUEUE_NAMES.EMAIL_QUEUE, "sendPasswordResetEmail", {
    userId: Number(user.id),
    email: user.email,
    fullName: user.name,
    resetUrl: url,
  });
};
