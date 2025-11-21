"use client";

import { CircleXIcon, TriangleAlert } from "lucide-react";

import { useGetUserProfileStatus } from "@/app/(main)/hooks/use-get-user-profile-status";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const UserProfileStatusBanner = () => {
  const { status, isFetchingStatus, fetchProfileError } =
    useGetUserProfileStatus();

  if (isFetchingStatus) {
    return null;
  }

  if (fetchProfileError || !status) {
    return (
      <div className="border-destructive bg-destructive/10 grid w-full max-w-xl items-center gap-3 rounded-xl border p-2">
        <Alert className="flex items-center gap-2 border-0 bg-transparent">
          <CircleXIcon className="text-destructive" />
          <AlertTitle className="text-xs sm:text-sm md:text-base">
            Failed to fetch current status of your profile
          </AlertTitle>
        </Alert>
      </div>
    );
  }

  return status.complete ? null : (
    <div className="grid w-full max-w-xl items-center gap-3 rounded-xl border-[#92400e] sm:border sm:bg-[#fffbeb]">
      <Alert className="flex flex-col items-center gap-2 space-y-2 border-0 bg-transparent text-[#92400e] md:flex-row">
        <TriangleAlert />
        <AlertDescription className="text-center text-[#92400e] md:text-left">
          Complete your profile to continue applying for jobs.
        </AlertDescription>
        <Button size="sm" className="bg-foreground rounded-md">
          Complete Profile
        </Button>
      </Alert>
    </div>
  );
};
