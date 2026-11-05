import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import { BetterAuthUser } from "@/utils/auth/types";

export interface SendDeleteAccountVerificationRequest {
  user: BetterAuthUser;
  url: string;
  token: string;
}

export const sendDeleteAccountVerification = async ({
  user,
  url,
  token,
}: SendDeleteAccountVerificationRequest) => {
  await queueService.addJob(
    QUEUE_NAMES.EMAIL_QUEUE,
    "sendDeleteAccountEmailVerification",
    {
      userId: Number(user.id),
      email: user.email,
      fullName: user.name,
      url,
      token,
    },
  );
};
