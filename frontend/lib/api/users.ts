"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { env } from "@/env";
import { ApiResponse, UserProfile, UserWithProfile } from "@/lib/types";
import { UserIntentResponse } from "@/schemas/responses/users";
import { handleApiResponse } from "./helpers";

export const getUserIntent = async (): Promise<UserIntentResponse> => {
  const cookieStore = await cookies();
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/users/me/intent`, {
    credentials: "include",
    headers: {
      Cookie: cookieStore.toString(),
    },
    next: { revalidate: 300, tags: ["user-intent"] },
  });

  return res.json();
};

export const getUserInformation = async (): Promise<
  ApiResponse<UserWithProfile>
> => {
  const cookieStore = await cookies();
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/users/me`, {
    credentials: "include",
    headers: {
      Cookie: cookieStore.toString(),
    },
    next: { revalidate: 300, tags: [`user-bio-info`] },
  });

  return handleApiResponse(res, "Failed to fetch user information");
};

export async function revalidateUserProfile() {
  revalidatePath("/me/profile/qualifications");
}

export const updateProfileVisibility = async (
  isProfilePublic: boolean,
): Promise<ApiResponse<UserProfile>> => {
  const cookieStore = await cookies();
  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/users/me/visibility`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieStore.toString(),
    },
    body: JSON.stringify({ isProfilePublic }),
  });

  const result = await handleApiResponse<UserProfile>(
    res,
    "Failed to update profile visibility",
  );

  if (result.success) {
    revalidatePath("/profile");
  }

  return result;
};

export const updateWorkAvailability = async (
  isAvailableForWork: boolean,
): Promise<ApiResponse<UserProfile>> => {
  const cookieStore = await cookies();
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/users/me/availability`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
      body: JSON.stringify({ isAvailableForWork }),
    },
  );

  const result = await handleApiResponse<UserProfile>(
    res,
    "Failed to update work availability",
  );

  if (result.success) {
    revalidateTag("user-bio-info");
  }

  return result;
};
