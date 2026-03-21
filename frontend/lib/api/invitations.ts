"use server";

import { cookies } from "next/headers";
import { env } from "@/env";
import { ApiResponse, InvitationDetails } from "@/lib/types";
import { handleApiResponse } from "./helpers";

export const getInvitationDetails = async (
  token: string,
): Promise<ApiResponse<InvitationDetails>> => {
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/invitations/${token}/details`,
    { next: { revalidate: 0 } },
  );

  return handleApiResponse(res, "Failed to fetch invitation details");
};

export const acceptInvitation = async (
  token: string,
): Promise<ApiResponse<{ organizationId: number }>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/invitations/${token}/accept`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Cookie: cookieStore.toString(),
      },
    },
  );

  return handleApiResponse(res, "Failed to accept invitation");
};
